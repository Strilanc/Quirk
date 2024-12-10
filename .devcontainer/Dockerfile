FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# ARG UBUNTU_PACKAGES="bat p7zip p7zip-full p7zip-rar"
ARG UBUNTU_PACKAGES="bat p7zip p7zip-full"

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends ${UBUNTU_PACKAGES} \
    firefox-esr \
    chromium \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /var/tmp/*
    # && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# RUN curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg && \
#     install -o root -g root -m 644 microsoft.gpg /etc/apt/trusted.gpg.d/ && \
#     sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/edge stable main" > /etc/apt/sources.list.d/microsoft-edge-dev.list' && \
#     rm microsoft.gpg && \
#     apt-get update && \
#     apt install -y microsoft-edge-stable
