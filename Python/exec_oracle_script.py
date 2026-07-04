import cx_Oracle
import sys

def execute_sql_file(connection_string, username, password, sql_file):
    # Validate parameters
    if not connection_string or not username or not password or not sql_file:
        raise ValueError("All parameters are required")
        
    try:
        with open(sql_file) as f:
            sql_script = f.read()
    except FileNotFoundError:
        raise FileNotFoundError(f"File {sql_file} not found")

    # Establish connection
    dsn_tns = cx_Oracle.makedsn(connection_string)
    conn = cx_Oracle.connect(username, password, dsn_tns)

    # Create cursor
    cursor = conn.cursor()
    
    try:
        # Execute the script
        cursor.execute(sql_script)
        
        # Enable DBMS_OUTPUT
        cursor.callproc('DBMS_OUTPUT.ENABLE')
        
        # Fetch and print output
        while True:
            result = cursor.var(cx_Oracle.STRING).getvalue(0)
            if not result:
                break
            print(result)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) != 5:
        raise ValueError("Invalid number of arguments. Usage: python script.py connection_string username password sql_file")
    
    execute_sql_file(*sys.argv[1:])
