// One `buildx bake` builds both images from the shared Dockerfile so their common stages are
// built and their cache exported once. The workflow sets TAG; cache lives in the registry.
variable "IMAGE" { default = "ghcr.io/con2/hardwood" }
variable "TAG" { default = "dev" }

group "default" {
  targets = ["runner", "migrator"]
}

target "common" {
  context    = "."
  dockerfile = "Dockerfile"
  cache-from = ["type=registry,ref=${IMAGE}:buildcache"]
  cache-to   = ["type=registry,ref=${IMAGE}:buildcache,mode=max,image-manifest=true,oci-mediatypes=true"]
}

target "runner" {
  inherits = ["common"]
  target   = "runner"
  tags     = ["${IMAGE}:${TAG}"]
}

target "migrator" {
  inherits = ["common"]
  target   = "migrator"
  tags     = ["${IMAGE}:${TAG}-migrate"]
}
