#!/usr/bin/env python3
"""
run_plsql_block.py

Executes a PL/SQL anonymous block (begin ... end;) read from a file against
an Oracle database, capturing and printing anything sent to DBMS_OUTPUT.

Usage:
    python run_plsql_block.py <connection_string> <username> <password> <sql_file>

Example:
    python run_plsql_block.py "myhost:1521/orclpdb1" myuser mypass myproc.sql

Requirements:
    pip install oracledb

Notes:
    - Uses python-oracledb in "thin" mode by default, so no Oracle Instant
      Client installation is required to connect to Oracle 12c.
    - <connection_string> is the DSN, e.g. "host:port/service_name" or a
      full Easy Connect string / TNS alias.
"""

import argparse
import os
import sys

import oracledb


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Execute a PL/SQL begin/end block from a file and print its DBMS_OUTPUT."
    )
    parser.add_argument(
        "connection_string",
        help="Oracle connection string / DSN (e.g. host:port/service_name)",
    )
    parser.add_argument("username", help="Database username")
    parser.add_argument("password", help="Database password")
    parser.add_argument(
        "sql_file",
        help="Path to a .sql file containing a PL/SQL begin/end block",
    )

    # argparse already treats all positional arguments as mandatory:
    # if any is missing, it prints a usage message and exits with an error.
    return parser.parse_args()


def read_plsql_block(sql_file_path):
    if not os.path.isfile(sql_file_path):
        print(f"ERROR: file not found: {sql_file_path}", file=sys.stderr)
        sys.exit(1)

    with open(sql_file_path, "r", encoding="utf-8") as f:
        block = f.read()

    if not block.strip():
        print(f"ERROR: file is empty: {sql_file_path}", file=sys.stderr)
        sys.exit(1)

    return block


def connect_to_database(username, password, connection_string):
    try:
        connection = oracledb.connect(
            user=username,
            password=password,
            dsn=connection_string,
        )
    except oracledb.Error as e:
        print(f"ERROR: could not connect to database: {e}", file=sys.stderr)
        sys.exit(1)

    return connection


def enable_dbms_output(cursor):
    # Passing None as the buffer size means "unlimited" on 12c
    cursor.callproc("dbms_output.enable", [None])


def print_dbms_output(cursor):
    chunk_size = 100
    lines_var = cursor.arrayvar(str, chunk_size)
    num_lines_var = cursor.var(int)
    num_lines_var.setvalue(0, chunk_size)

    while True:
        cursor.callproc("dbms_output.get_lines", (lines_var, num_lines_var))
        num_lines = num_lines_var.getvalue()
        lines = lines_var.getvalue()[:num_lines]

        for line in lines:
            print(line if line is not None else "")

        if num_lines < chunk_size:
            break


def execute_plsql_block(connection, plsql_block):
    with connection.cursor() as cursor:
        enable_dbms_output(cursor)

        try:
            cursor.execute(plsql_block)
        except oracledb.Error as e:
            print(f"ERROR: error executing PL/SQL block: {e}", file=sys.stderr)
            sys.exit(1)

        print_dbms_output(cursor)


def main():
    args = parse_arguments()

    plsql_block = read_plsql_block(args.sql_file)

    connection = connect_to_database(
        args.username, args.password, args.connection_string
    )

    try:
        execute_plsql_block(connection, plsql_block)
    finally:
        connection.close()


if __name__ == "__main__":
    main()