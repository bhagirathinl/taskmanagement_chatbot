#!/bin/bash

#######################################
# Add Swap Space to EC2 Instance
# Use this if you forgot to add swap or need more
#######################################

set -e

echo "💾 Setting up swap space..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if swap already exists
if [ $(swapon --show | wc -l) -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Swap space already exists:${NC}"
    swapon --show
    free -h
    echo ""
    read -p "Do you want to add MORE swap? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 0
    fi
fi

# Ask for swap size
echo "How much swap do you want to add?"
echo "1) 1 GB (for t2.micro with existing swap)"
echo "2) 2 GB (recommended for t2.micro)"
echo "3) 4 GB (for t3.small)"
read -p "Choose (1-3): " choice

case $choice in
    1)
        SIZE=1024
        ;;
    2)
        SIZE=2048
        ;;
    3)
        SIZE=4096
        ;;
    *)
        echo -e "${RED}Invalid choice. Using 2GB default.${NC}"
        SIZE=2048
        ;;
esac

echo -e "${YELLOW}Creating ${SIZE}MB swap file...${NC}"

# Create swap file
SWAP_FILE="/swapfile_$(date +%s)"
sudo dd if=/dev/zero of=$SWAP_FILE bs=1M count=$SIZE status=progress
sudo chmod 600 $SWAP_FILE
sudo mkswap $SWAP_FILE
sudo swapon $SWAP_FILE

# Make it permanent
echo "$SWAP_FILE none swap sw 0 0" | sudo tee -a /etc/fstab

echo -e "${GREEN}✅ Swap space added successfully!${NC}"
echo ""
echo "Current memory status:"
free -h
echo ""
echo "Active swap files:"
swapon --show
