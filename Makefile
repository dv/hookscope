test:
	./node_modules/.bin/mocha \
	--reporter list \
	-r should

watch:
	./node_modules/.bin/mocha \
	--reporter list \
	-r should \
	-G -w

.PHONY: test watch