import os
import cx_Oracle
import sys

def main():
    if len(sys.argv) != 5:
        print("Usage: python execute_sql.py <connection_string> <username> <password> <sql_file>")
        sys.exit(1)

    connection_string = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3]
    sql_file = sys.argv[4]

    if not os.path.exists(sql_file):
        print(f"Error: File {sql_file} does not exist.")
        sys.exit(1)

    try:
        connection = cx_Oracle.connect(username, password, connection_string)
        cursor = connection.cursor()
        
        # Enable DBMS_OUTPUT to capture output
        cursor.execute("BEGIN dbms_output.enable; END;")
        
        with open(sql_file, 'r') as file:
            sql_script = file.read()
            
        cursor.execute(sql_script)
        
        # Fetch and print all captured output from DBMS_OUTPUT
        while True:
            output = cursor.var(cx_Oracle.STRING)
            status = cursor.callfunc("DBMS_OUTPUT.GET_LINE", int, [output, 100])
            if status == 0:
                break
            print(output.getvalue())
        
    except cx_Oracle.DatabaseError as e:
        error, _ = e.args
        print(f"Database error: {error.code} - {error.message}")
        sys.exit(1)
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    main()
