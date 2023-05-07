# AIMM

AI Model Manager.

## Terminology

| APM        | Civitai            | HuggingFace      |
|------------|--------------------|------------------|
| Repository | Model (checkpoint) | Repo             |
| Revision   | Model version      | Revsion / commit |

# Use it

```sh

# Initialize a new project
aimm init

# Probe an existing directory to build a map file
aimm scan

# Install from Git
aimm add https://github.com/AUTOMATIC1111/stable-diffusion-webui

# Install a model from Civitai
aimm add https://civitai.com/models/7240/meinamix 

# Install a model to a specific place
aimm add https://civitai.com/models/7240/meinamix ./models/meinamix

# Install a Lora from Civitai, and automatically pair it with previews
aimm add https://civitai.com/models/13213

# Install a model from Hugging Face
aimm add https://huggingface.co/THUDM/chatglm-6b/blob/main/pytorch_model-00001-of-00008.bin

# Download a model by name
aimm add bloom

# Install from an existing amm.json
aimm add
aimm add -r non-default-named.amm.json

```

# License
MIT
