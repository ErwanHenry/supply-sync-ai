#!/usr/bin/env node

import dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import { SyncOSCommander } from './commander';
import { AgentOrchestrator } from './orchestrator';
import { logger } from './utils/logger';

dotenv.config();

async function main() {
  console.log(chalk.cyan.bold(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║        SupplySync AI - SyncOS Commander          ║
  ║     Autonomous PM Agent System v0.1.0            ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `));

  const spinner = ora('Initializing SyncOS Commander...').start();

  try {
    // Validate environment variables
    validateEnvironment();
    spinner.succeed('Environment validated');

    // Initialize PM Agent (SyncOS Commander)
    spinner.start('Initializing SyncOS Commander (PM Agent)...');
    const commander = new SyncOSCommander({
      model: process.env.AGENT_MODEL || 'claude-opus-4-20250514',
      temperature: parseFloat(process.env.AGENT_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.AGENT_MAX_TOKENS || '4096'),
    });
    await commander.initialize();
    spinner.succeed('SyncOS Commander initialized');

    // Initialize Multi-Agent Orchestrator
    spinner.start('Initializing Agent Orchestrator...');
    const orchestrator = new AgentOrchestrator(commander);
    await orchestrator.initialize();
    spinner.succeed('Agent Orchestrator initialized');

    // Load agent team
    spinner.start('Loading 6 specialized agents...');
    await orchestrator.loadAgents([
      'backend-architect',
      'ml-engineer',
      'frontend-dev',
      'integration-engineer',
      'qa-devops',
    ]);
    spinner.succeed('All agents loaded and ready');

    // Start orchestration server
    const port = parseInt(process.env.ORCHESTRATOR_PORT || '3100');
    spinner.start(`Starting orchestrator server on port ${port}...`);
    await orchestrator.startServer(port);
    spinner.succeed(`Orchestrator running on http://localhost:${port}`);

    console.log(chalk.green.bold('\n✅ SyncOS Commander is ready!\n'));
    console.log(chalk.white('Available commands:'));
    console.log(chalk.gray('  • /plan <feature>     - Plan a new feature'));
    console.log(chalk.gray('  • /sprint             - Start new sprint planning'));
    console.log(chalk.gray('  • /metrics            - View product metrics'));
    console.log(chalk.gray('  • /roadmap            - Update product roadmap'));
    console.log(chalk.gray('  • /experiment <name>  - Launch A/B test'));
    console.log(chalk.gray('  • /analyze <topic>    - Analyze user feedback'));
    console.log(chalk.gray('  • /status             - Check agent system status'));
    console.log(chalk.gray('  • /help               - Show all commands\n'));

    // Keep process alive
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n\n⏹️  Shutting down SyncOS Commander...'));
      await orchestrator.shutdown();
      process.exit(0);
    });

  } catch (error) {
    spinner.fail('Failed to initialize SyncOS Commander');
    logger.error('Initialization error:', error);
    process.exit(1);
  }
}

function validateEnvironment(): void {
  const required = [
    'ANTHROPIC_API_KEY',
    'PINECONE_API_KEY',
    'DATABASE_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
