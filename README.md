# Vision Shop Assistant

An AI-powered shopping assistant that uses Meta Ray-Ban Smart Glasses to analyze products and make informed purchase decisions through voice commands.

## Features

- Voice-activated product analysis
- Real-time visual product recognition
- Multiple analysis categories:
  - Clothing and accessories
  - Food and beverages
  - Tech products
  - Art and collectibles
  - Scene and environment context
- Local product history tracking
- Cross-platform shopping integration

## Prerequisites

- [Meta Ray-Ban Smart Glasses](https://about.fb.com/news/2023/09/new-ray-ban-meta-smart-glasses/)
- [OpenAI API Key](https://platform.openai.com/)
- Alternative Facebook/Messenger account
- Chromium-based browser
- [Bun](https://bun.sh/) runtime

## Quick Start

1. Clone the repository
2. Create `.env` file from `env.example` and add your OpenAI API key
3. Install dependencies:

````bash
bun install


4. Start the server:
```bash
bun dev
````

## Setup Guide

### 1. Messenger Group Chat Setup

1. Create a new Messenger group chat with 2 other Facebook accounts
2. Remove one account (keeping only your main and alt account)
3. Rename the chat to your desired AI service (e.g., "ChatGPT")
4. Set a group photo (optional)
5. Set a nickname for your alt account

### 2. Meta View App Configuration

1. Open Meta View app
2. Navigate to Communications section
3. Disconnect and reconnect your Messenger account to sync new chats

### 3. Browser Extension Setup

1. Login to messenger.com with your alt account
2. Open your newly created group chat
3. Create a new bookmark with the code from bookmarklet.js
4. Click the bookmark to start monitoring

## Usage

### Voice Commands

Say "Hey Meta, analyze this [product/item]" to:

- Capture product image
- Receive detailed product analysis
- Get shopping recommendations
- Compare prices (coming soon)
- Track purchase history (coming soon)

### Analysis Categories

- **Clothing**: Style, fit, material, and fashion recommendations
- **Food**: Ingredients, nutrition, and dietary considerations
- **Tech**: Specifications, features, and compatibility
- **Art**: Authentication, valuation, and collection advice
- **Scene**: Shopping environment and retail context

## Development

### Server Endpoints

- POST /api/vision : Process images through GPT4 Vision
- GET /api/status : Check server health

### Project Structure

```plaintext
meta-vision-api/
├── src/
│   ├── server.ts      # Main server implementation
│   └── bookmarklet.js # Browser integration
├── public/
│   ├── images/        # Stored analyzed images
│   └── data.json     # Analysis results
└── .env              # Configuration
```

## Contributing

Feel free to submit issues and enhancement requests!

## Credits

Created by Devon Crebbin

## Future Development

- Price comparison integration
- Purchase automation
- Shopping history analytics
- Multi-store inventory checking
- Personal style profiling
- Budget tracking and recommendations
