TAG_LATEST = "docker.io/nilsherzig/$(shell basename $(PWD)):latest"

build: 
	docker build -t $(TAG_LATEST) -f Dockerfile .

push: 
	docker push $(TAG_LATEST)

run: 
	docker run --rm -p 3000:3000 $(TAG_LATEST)
