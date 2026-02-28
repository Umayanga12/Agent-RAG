#!/bin/bash
# Script to index all PDF documents from the data directory

echo "Starting batch indexing of legal documents..."
echo ""

DATA_DIR="../data"
DOCUMENTS=(
    "constitution.pdf"
)

TOTAL=${#DOCUMENTS[@]}
SUCCESS=0
FAILED=0

for i in "${!DOCUMENTS[@]}"; do
    DOC="${DOCUMENTS[$i]}"
    NUM=$((i + 1))
    
    echo "[$NUM/$TOTAL] Indexing $DOC..."
    
    if uv run python index_document.py "$DATA_DIR/$DOC"; then
        SUCCESS=$((SUCCESS + 1))
        echo "Success!"
    else
        FAILED=$((FAILED + 1))
        echo "Failed!"
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Indexing Summary:"
echo "   Total: $TOTAL documents"
echo "   Success: $SUCCESS"
echo "   Failed: $FAILED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
