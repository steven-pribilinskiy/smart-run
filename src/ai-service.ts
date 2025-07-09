import clipboardy from 'clipboardy';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ quiet: true });

type AIAnalysisResult = {
  scriptGroups: Array<{
    name: string;
    scripts: Array<{
      key: string;
      description: string;
    }>;
  }>;
};

export class AIService {
  private openai: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      null;

    if (this.apiKey && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: this.apiKey,
      });
    }
  }

  public hasApiKey(): boolean {
    return this.apiKey !== null;
  }

  public getAvailableProviders(): string[] {
    const providers = [];
    if (process.env.OPENAI_API_KEY) providers.push('OpenAI');
    if (process.env.ANTHROPIC_API_KEY) providers.push('Claude');
    if (process.env.GOOGLE_API_KEY) providers.push('Gemini');
    return providers;
  }

  public async analyzeScripts(scripts: Record<string, string>): Promise<AIAnalysisResult> {
    if (!this.openai) {
      throw new Error(
        'OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.'
      );
    }

    const scriptEntries = Object.entries(scripts)
      .filter(([key, value]) => !key.startsWith('\n#') || value !== '')
      .map(([key, value]) => `"${key}": "${value}"`)
      .join('\n');

    const prompt = `Analyze the following npm scripts and organize them into logical groups with meaningful descriptions.

Scripts:
${scriptEntries}

Please return a JSON response with the following structure:
{
  "scriptGroups": [
    {
      "name": "Group Name",
      "scripts": [
        {
          "key": "script-name",
          "description": "Clear, helpful description of what this script does"
        }
      ]
    }
  ]
}

Guidelines:
- Group scripts by purpose (Development, Testing, Build, Deployment, etc.)
- Write clear, concise descriptions that explain what each script does
- Use professional, developer-friendly language
- Only include scripts that are actually defined
- Common groups: Development, Testing, Build & Deploy, Code Quality, Maintenance`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert developer assistant that helps organize and document npm scripts. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      // Parse the JSON response
      const result = JSON.parse(content) as AIAnalysisResult;

      // Validate the response structure
      if (!result.scriptGroups || !Array.isArray(result.scriptGroups)) {
        throw new Error('Invalid response format from AI service');
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AI analysis failed: ${error.message}`);
      }
      throw new Error('Unknown error during AI analysis');
    }
  }

  public generatePromptForManualAnalysis(scripts: Record<string, string>): string {
    const scriptEntries = Object.entries(scripts)
      .filter(([key, value]) => !key.startsWith('\n#') || value !== '')
      .map(([key, value]) => `"${key}": "${value}"`)
      .join('\n');

    return `Please analyze these npm scripts and create a package-meta.yaml configuration:

Scripts to analyze:
${scriptEntries}

Create a package-meta.yaml file with this structure:
\`\`\`yaml
# Smart-run configuration
scriptGroups:
  - name: "Development"
    scripts:
      - key: start
        description: "Start development server"
      - key: build
        description: "Build for production"
  - name: "Testing"
    scripts:
      - key: test
        description: "Run test suite"
      - key: test:watch
        description: "Run tests in watch mode"
  # Add more groups as needed
\`\`\`

Guidelines:
- Group scripts by purpose (Development, Testing, Build, Deployment, Code Quality, etc.)
- Write clear, concise descriptions explaining what each script does
- Only include scripts that are actually defined in package.json
- Use professional, developer-friendly language`;
  }

  public async copyToClipboard(text: string): Promise<void> {
    try {
      await clipboardy.write(text);
    } catch (_error) {
      throw new Error('Failed to copy to clipboard');
    }
  }
}
