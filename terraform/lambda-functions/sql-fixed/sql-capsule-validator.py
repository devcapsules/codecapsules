"""
SQL Capsule Validator - Hybrid SQLite/PostgreSQL Validation

This function validates SQL capsules using:
1. In-Memory SQLite (default) - Fast, free, isolated
2. PostgreSQL with ROLLBACK (for advanced features)

Architecture:
- Creates ephemeral database from schema_setup
- Executes reference_solution to get expected output
- Executes user_query to get actual output
- Compares result sets for validation
"""

import json
import sqlite3
import os
import time
import psycopg2
from psycopg2.extras import RealDictCursor


def lambda_handler(event, context):
    """
    Main handler for SQL capsule validation
    
    Event format:
    {
        "body": {
            "schema_setup": ["CREATE TABLE...", "INSERT INTO..."],
            "reference_solution": "SELECT ...",
            "user_query": "SELECT ...",
            "requires_postgres": false,
            "expected_output": [{"col": "val"}]  // Optional, can be computed
        }
    }
    """
    start_time = time.time()
    
    try:
        # Parse input
        if 'body' in event and isinstance(event['body'], str):
            body = json.loads(event['body'])
        else:
            body = event
        
        schema_setup = body.get('schema_setup', [])
        reference_solution = body.get('reference_solution', '').strip()
        user_query = body.get('user_query', '').strip()
        requires_postgres = body.get('requires_postgres', False)
        expected_output = body.get('expected_output')
        
        # Validate inputs
        if not schema_setup:
            return create_error_response("No schema_setup provided")
        
        if not reference_solution:
            return create_error_response("No reference_solution provided")
        
        # Choose validation strategy
        if requires_postgres:
            result = validate_with_postgres(
                schema_setup, 
                reference_solution, 
                user_query,
                expected_output
            )
        else:
            result = validate_with_sqlite(
                schema_setup, 
                reference_solution, 
                user_query,
                expected_output
            )
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': result['success'],
                'validation_mode': 'postgres' if requires_postgres else 'sqlite',
                'user_result': result.get('user_result'),
                'expected_result': result.get('expected_result'),
                'columns': result.get('columns'),
                'error': result.get('error'),
                'executionTime': execution_time
            })
        }
        
    except Exception as e:
        return create_error_response(f"Validation failed: {str(e)}")


def validate_with_sqlite(schema_setup, reference_solution, user_query, expected_output):
    """
    Validate using in-memory SQLite (fast, free, isolated)
    """
    conn = None
    try:
        # Create ephemeral in-memory database
        conn = sqlite3.connect(':memory:')
        conn.row_factory = sqlite3.Row  # Get dict-like rows
        cursor = conn.cursor()
        
        # Execute schema setup
        for statement in schema_setup:
            if statement.strip():
                cursor.execute(statement)
        
        # Execute reference solution to get expected output
        cursor.execute(reference_solution)
        expected_rows = cursor.fetchall()
        expected_cols = [description[0] for description in cursor.description]
        expected_result = [dict(row) for row in expected_rows]
        
        # If user query provided, validate it
        if user_query:
            try:
                cursor.execute(user_query)
                user_rows = cursor.fetchall()
                user_cols = [description[0] for description in cursor.description]
                user_result = [dict(row) for row in user_rows]
                
                # Compare results (set comparison ignores order)
                is_correct = (
                    set(tuple(sorted(row.items())) for row in user_result) ==
                    set(tuple(sorted(row.items())) for row in expected_result)
                )
                
                # Check column names match
                if is_correct and user_cols != expected_cols:
                    is_correct = False
                
                return {
                    'success': is_correct,
                    'user_result': user_result,
                    'expected_result': expected_result,
                    'columns': user_cols,
                    'error': None if is_correct else 'Results do not match expected output'
                }
            except sqlite3.Error as e:
                return {
                    'success': False,
                    'user_result': None,
                    'expected_result': expected_result,
                    'columns': expected_cols,
                    'error': f"SQL Error: {str(e)}"
                }
        else:
            # No user query, just return expected output (for generation validation)
            return {
                'success': True,
                'expected_result': expected_result,
                'columns': expected_cols
            }
            
    except sqlite3.Error as e:
        return {
            'success': False,
            'error': f"SQLite Error: {str(e)}"
        }
    finally:
        if conn:
            conn.close()


def validate_with_postgres(schema_setup, reference_solution, user_query, expected_output):
    """
    Validate using PostgreSQL with ROLLBACK (for advanced features)
    """
    conn = None
    try:
        # Connect to Supabase
        db_config = {
            'host': os.environ.get('DB_HOST'),
            'database': os.environ.get('DB_NAME', 'postgres'),
            'user': os.environ.get('DB_USER_RO'),
            'password': os.environ.get('DB_PASS_RO'),
            'port': os.environ.get('DB_PORT', 5432),
            'connect_timeout': 10,
            'sslmode': 'require'
        }
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Start transaction
        cursor.execute("BEGIN;")
        
        # Execute schema setup
        for statement in schema_setup:
            if statement.strip():
                cursor.execute(statement)
        
        # Execute reference solution
        cursor.execute(reference_solution)
        expected_rows = cursor.fetchall()
        expected_result = [dict(row) for row in expected_rows]
        expected_cols = [desc.name for desc in cursor.description]
        
        # If user query provided, validate it
        if user_query:
            try:
                cursor.execute(user_query)
                user_rows = cursor.fetchall()
                user_result = [dict(row) for row in user_rows]
                user_cols = [desc.name for desc in cursor.description]
                
                # Compare results
                is_correct = (
                    set(tuple(sorted(row.items())) for row in user_result) ==
                    set(tuple(sorted(row.items())) for row in expected_result)
                )
                
                if is_correct and user_cols != expected_cols:
                    is_correct = False
                
                result = {
                    'success': is_correct,
                    'user_result': user_result,
                    'expected_result': expected_result,
                    'columns': user_cols,
                    'error': None if is_correct else 'Results do not match expected output'
                }
            except psycopg2.Error as e:
                result = {
                    'success': False,
                    'user_result': None,
                    'expected_result': expected_result,
                    'columns': expected_cols,
                    'error': f"SQL Error: {str(e)}"
                }
        else:
            result = {
                'success': True,
                'expected_result': expected_result,
                'columns': expected_cols
            }
        
        # CRITICAL: Always rollback to prevent any database changes
        cursor.execute("ROLLBACK;")
        
        return result
        
    except psycopg2.Error as e:
        return {
            'success': False,
            'error': f"PostgreSQL Error: {str(e)}"
        }
    finally:
        if conn:
            conn.close()


def create_error_response(error_message):
    """Create standardized error response"""
    return {
        'statusCode': 400,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': False,
            'error': error_message
        })
    }
