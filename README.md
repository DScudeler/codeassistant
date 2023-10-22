# Code Assistant
A small personnal project to play with AI and VS Code.

Code assistant provides a bridge between coding LLM and your development environment.

> **DISCLAIMER** : This project is just a try. It does not meet any QA expectations
> and is not related to my employer in any way.  
> I highly recommend that you use other LLM frameworks or extensions for production.

## Features
Chat with your source code through LLM.

## Requirements
A gRPC server following the instruction protocol has to be up.

## Extension Settings
This extension contributes the following settings:

* `codeAssistant.server.address`: LLM server address.
* `codeAssistant.prompt.system`: System prompt used to open chat.
* `codeAssistant.prompt.user`: User prompt used to open chat.
* `codeAssistant.prompt.assistant`: Simulated answer from assistant to open chat.

## Known Issues
- general robustness regarding server connection
- string format issues when retreiving some code with \{

## Release Notes
### 0.0.1

Initial release

---
