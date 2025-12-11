# Contributing to KK AI Translator

Thank you for your interest in contributing to KK AI Translator! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Adding New Languages](#adding-new-languages)

---

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all backgrounds and experience levels.

---

## Getting Started

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/kk-ai-translator.git
   cd kk-ai-translator
   ```

3. **Set up the development environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   make dev
   ```

4. **Create a branch for your changes:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## How to Contribute

### Reporting Bugs

- Check if the bug has already been reported in Issues
- If not, create a new issue with:
  - Clear title and description
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment details (OS, Python version, etc.)

### Suggesting Features

- Open an issue with the "feature request" label
- Describe the feature and its use case
- Explain why it would benefit the project

### Contributing Code

- Bug fixes
- New features
- Documentation improvements
- Test coverage improvements
- Performance optimizations

---

## Development Workflow

### Backend (Python/Flask)

```bash
# Start development server
make dev

# Run tests
make test

# Format code
black python-be/src

# Lint
flake8 python-be/src
```

### Frontend (React)

```bash
cd react-fe

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

### Running the Full Stack with Docker

```bash
# Build and run
make build-full
make run-full

# View logs
docker logs translator-full-container
```

---

## Pull Request Process

1. **Ensure your code follows the coding standards** (see below)

2. **Write tests** for new functionality

3. **Update documentation** if needed (README, SETUP.md, docstrings)

4. **Run the test suite:**
   ```bash
   make test
   ```

5. **Create a pull request** with:
   - Clear title describing the change
   - Description of what and why
   - Link to related issue (if applicable)
   - Screenshots (for UI changes)

6. **Address review feedback** promptly

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New code has appropriate test coverage
- [ ] Documentation updated (if applicable)
- [ ] No secrets or credentials in code
- [ ] Commit messages are clear and descriptive

---

## Coding Standards

### Python

- Follow [PEP 8](https://pep8.org/) style guide
- Use [Black](https://black.readthedocs.io/) for formatting
- Use type hints where practical
- Write docstrings for public functions
- Keep functions focused and small

```python
# Good
def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """
    Translate text from source language to target language.

    Args:
        text: The text to translate
        source_lang: ISO language code (e.g., 'en-GB')
        target_lang: ISO language code (e.g., 'da-DK')

    Returns:
        Translated text
    """
    ...
```

### TypeScript/React

- Use TypeScript for type safety
- Follow React best practices (hooks, functional components)
- Use meaningful component and variable names
- Keep components small and focused

```typescript
// Good
interface TranslationCardProps {
  text: string;
  language: string;
  onPlay?: () => void;
}

const TranslationCard: React.FC<TranslationCardProps> = ({
  text,
  language,
  onPlay
}) => {
  // ...
};
```

### Git Commits

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Reference issues when applicable

```
Good: "Add Arabic (Syrian) language support"
Good: "Fix TTS audio format conversion issue #42"
Bad: "updates"
Bad: "fixed stuff"
```

---

## Adding New Languages

To add support for a new language:

1. **Edit `python-be/src/config/languages.py`:**

```python
"xx-XX": {
    "english_name": "Language Name",
    "native_name": "Native Name",
    "region": "Region/Country",
    "models": {
        "transcribeModel": "azure_speech",  # or "promte_whisper"
        "translationModel": "gpt4o-mini",
        "summaryModel": "gpt4o-mini",
    },
    "default_voice": "xx-XX-VoiceNameNeural",
},
```

2. **Verify Azure Speech support:**
   - Check [Azure Speech language support](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support)
   - Find an appropriate neural voice

3. **Test the language:**
   - Transcription (speech-to-text)
   - Translation (to/from Danish)
   - TTS (text-to-speech)

4. **Update documentation:**
   - Add to README.md language table
   - Add to SETUP.md if there are special requirements

5. **Submit a PR** with your changes

---

## Questions?

Feel free to open an issue for any questions about contributing. We're happy to help!
