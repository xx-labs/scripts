OS:=$(shell uname -s)
BINPATH:="./bin/xxnetwork-chain-darwin"

ifeq ($(OS),Linux)
	BINPATH:="./bin/xxnetwork-chain-linux"
endif

run:
	@rm -rf db chain.log
	$(BINPATH) --alice --chain xxnetwork-dev --base-path ./db --rpc-cors all >> ./chain.log 2>&1 &

stop:
	@kill -9 `ps aux | grep "xxnetwork-chain" | grep -v grep | awk '{print $$2}'` &> /dev/null || true
