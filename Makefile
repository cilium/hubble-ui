# Copyright 2017-2020 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

DOCKER_BUILDER := default

# Export with value expected by docker
export DOCKER_BUILDKIT=1

# Docker Buildx support. If ARCH is defined, a builder instance 'cross'
# on the local node is configured for amd64 and arm64 platform targets.
# Otherwise build on the current (typically default) builder for the host
# platform only.
ifdef ARCH
  # Default to multi-arch builds, always create the builder for all the platforms we support
  DOCKER_PLATFORMS := linux/arm64,linux/amd64
  DOCKER_BUILDER := $(shell docker buildx ls | grep -E -e "[a-zA-Z0-9-]+ \*" | cut -d ' ' -f1)
  ifeq ($(DOCKER_BUILDER),default)
    DOCKER_BUILDKIT_DRIVER :=
    ifdef DOCKER_BUILDKIT_IMAGE
      DOCKER_BUILDKIT_DRIVER := --driver docker-container --driver-opt image=$(DOCKER_BUILDKIT_IMAGE)
    endif
    BUILDER_SETUP := $(shell docker buildx create --platform $(DOCKER_PLATFORMS) $(DOCKER_BUILDKIT_DRIVER) --use)
  endif
  # Override default for a single platform
  ifneq ($(ARCH),multi)
    DOCKER_PLATFORMS := linux/$(ARCH)
  endif
  DOCKER_FLAGS += --push --platform $(DOCKER_PLATFORMS)
else
  # ARCH not specified, build for the host platfrom without pushing, mimicking regular docker build
  DOCKER_FLAGS += --load
endif
DOCKER_BUILDER := $(shell docker buildx ls | grep -E -e "[a-zA-Z0-9-]+ \*" | cut -d ' ' -f1)

##@ Docker Images
.PHONY: builder-info
builder-info: ## Print information about the docker builder that will be used for building images.
	@echo "Using Docker Buildx builder \"$(DOCKER_BUILDER)\" with build flags \"$(DOCKER_FLAGS)\"."

DOCKER_REGISTRY ?= quay.io

# Set DOCKER_DEV_ACCOUNT with "cilium" by default
ifeq ($(DOCKER_DEV_ACCOUNT),)
    DOCKER_DEV_ACCOUNT=cilium
endif

# Set DOCKER_IMAGE_TAG with "latest" by default
ifeq ($(DOCKER_IMAGE_TAG),)
    DOCKER_IMAGE_TAG=latest
endif

ifeq ($(findstring /,$(DOCKER_DEV_ACCOUNT)),/)
    # DOCKER_DEV_ACCOUNT already contains '/', assume it specifies a registry
    IMAGE_REPOSITORY := $(DOCKER_DEV_ACCOUNT)
else
    IMAGE_REPOSITORY := $(DOCKER_REGISTRY)/$(DOCKER_DEV_ACCOUNT)
endif

#
# Template for Docker images. Parameters are:
# $(1) image target name
# $(2) Docker image context
# $(3) Dockerfile path
# $(4) image name stem (e.g., cilium, cilium-operator, etc)
# $(5) image tag
#
define DOCKER_IMAGE_TEMPLATE
.PHONY: $(1)
$(1): $(3) builder-info
	$(eval IMAGE_NAME := $(subst %,$$$$*,$(4))$(UNSTRIPPED))
	$(QUIET)docker buildx build -f $(subst %,$$*,$(3)) \
		$(DOCKER_FLAGS) \
		-t $(IMAGE_REPOSITORY)/$(IMAGE_NAME):$(5) $(2)
ifeq ($(findstring --push,$(DOCKER_FLAGS)),)
	@echo 'Define "DOCKER_FLAGS=--push" to push the build results.'
else
	docker buildx imagetools inspect $(IMAGE_REPOSITORY)/$(IMAGE_NAME):$(5)
	@echo '^^^ Images pushed, multi-arch manifest should be above. ^^^'
endif

$(1)-unstripped: NOSTRIP=1
$(1)-unstripped: UNSTRIPPED=-unstripped
$(1)-unstripped: $(1)
endef

# hubble-ui
$(eval $(call DOCKER_IMAGE_TEMPLATE,hubble-ui,.,Dockerfile,hubble-ui,$(DOCKER_IMAGE_TAG)))

# hubble-ui-backend
$(eval $(call DOCKER_IMAGE_TEMPLATE,hubble-ui-backend,backend,backend/Dockerfile,hubble-ui-backend,$(DOCKER_IMAGE_TAG)))
