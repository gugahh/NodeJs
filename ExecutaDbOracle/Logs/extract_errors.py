"""
Scans lg_assinaturas log file for error lines containing "FALHA NO UPDATE - Processo:"
and extracts the tmttp_dk value from the 2 preceding lines.
Results are written to errors.txt.
"""

import re
import sys
from pathlib import Path

INPUT_FILE = "lg_atualiza_assinat_3_prod-2.log"
OUTPUT_FILE = "errors_lg_atualiza_assinat_3_prod-2.txt"

ERROR_MARKER = "FALHA NO UPDATE - Processo:"
TMTTP_PATTERN = re.compile(r"tmttp_dk:\s*(\S+)\s*-\s*sigilo:")


def extract_errors(input_path: str, output_path: str) -> None:
    input_file = Path(input_path)
    if not input_file.exists():
        print(f"Error: input file '{input_path}' not found.")
        sys.exit(1)

    found_codes = []
    # Keep a small rolling buffer of the last 2 lines
    buffer = []

    print(f"Scanning '{input_path}' ...")

    with input_file.open("r", encoding="utf-8", errors="replace") as f:
        for line_num, line in enumerate(f, start=1):
            stripped = line.rstrip("\n")

            if ERROR_MARKER in stripped:
                # Search the buffered lines for the tmttp_dk pattern
                matched = False
                for prev_line in reversed(buffer):
                    m = TMTTP_PATTERN.search(prev_line)
                    if m:
                        code = m.group(1)
                        found_codes.append(code)
                        print(f"  Line {line_num}: found tmttp_dk = {code}")
                        matched = True
                        break
                if not matched:
                    print(f"  Line {line_num}: ERROR marker found but no tmttp_dk in prior 2 lines.")

            # Maintain a rolling 2-line buffer
            buffer.append(stripped)
            if len(buffer) > 2:
                buffer.pop(0)

    with open(output_path, "w", encoding="utf-8") as out:
        out.write(f"Total errors found: {len(found_codes)}\n")
        out.write("-" * 40 + "\n")
        for code in found_codes:
            out.write(code + " ,\n")

    print(f"\nDone. {len(found_codes)} error(s) written to '{output_path}'.")


if __name__ == "__main__":
    # Optionally accept file paths as command-line arguments:
    #   python extract_errors.py [input_file] [output_file]
    inp = sys.argv[1] if len(sys.argv) > 1 else INPUT_FILE
    out = sys.argv[2] if len(sys.argv) > 2 else OUTPUT_FILE
    extract_errors(inp, out)
