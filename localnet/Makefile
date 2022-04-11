OS:=$(shell uname -s)
BINPATH:="./bin/xxnetwork-chain-darwin"

ifeq ($(OS),Linux)
	BINPATH:="./bin/xxnetwork-chain-linux"
endif

# Change number of accounts to generate here
accounts=10
# Change funds per account here
funds=1000

generate:
	@cd ./generate; node index.js ${accounts} ${funds}

run:
	@rm -rf db chain.log
	$(BINPATH) --alice --chain ./generate/genesis.json --base-path ./db --rpc-cors all > ./chain.log 2>&1 &

create-backup:
	@cd ./backup; yarn start

stop:
	@kill -9 `ps aux | grep "xxnetwork-chain" | grep -v grep | awk '{print $$2}'` &> /dev/null || true

.PHONY: generate create-backup
