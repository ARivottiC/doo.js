install:
	@npm install

test:
	@./node_modules/mocha-phantomjs/bin/mocha-phantomjs test/index.html

.PHONY: test
