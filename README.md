# Code Assistant
A small personnal project to play with AI and VS Code.

Code assistant provides a bridge between coding LLM and your development environment.

> **DISCLAIMER** : This project is just a try. It does not meet any QA expectations.    
> I highly recommend that you use other LLM frameworks or extensions for production.

## Features
Chat with your source code through LLM.

## Requirements
LLM server implementing OpenAI stream API.

## Extension Settings
This extension contributes the following settings:

* `codeAssistant.server.address`: LLM server address.
* `codeAssistant.prompt.system`: System prompt used to open chat.
* `codeAssistant.prompt.user`: User prompt used to open chat.
* `codeAssistant.prompt.assistant`: Simulated answer from assistant to open chat.

## Extension commands
* `codeAssistant.clearChat`: clear current chat.
* `codeAssistant.openChat`: sends prompt for current chat.

## demo
https://github.com/DScudeler/codeassistant/assets/64302229/10b89c12-e342-4025-b1a3-bb7980352692


## Known Issues
- general robustness regarding server connection
- string format issues when retreiving some code with \{
- chat does not display sometimes

## Release Notes
> See changelog

---
