import express, { Express, Request, Response } from 'express';
import { SyncOSCommander } from './commander';
import { logger } from './utils/logger';

interface Agent {
  name: string;
  role: string;
  status: 'idle' | 'busy' | 'offline';
  currentTask?: string;
}

/**
 * AgentOrchestrator - Coordinates all 6 specialized agents
 *
 * Agent Team:
 * 1. Backend Architect
 * 2. ML Engineer
 * 3. Frontend Developer
 * 4. Integration Engineer
 * 5. QA/DevOps
 */
export class AgentOrchestrator {
  private commander: SyncOSCommander;
  private agents: Map<string, Agent>;
  private app: Express;
  private initialized: boolean = false;

  constructor(commander: SyncOSCommander) {
    this.commander = commander;
    this.agents = new Map();
    this.app = express();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Orchestrator already initialized');
      return;
    }

    // Setup Express middleware
    this.app.use(express.json());
    this.setupRoutes();

    this.initialized = true;
    logger.info('Agent Orchestrator initialized');
  }

  /**
   * Load specialized agents
   */
  async loadAgents(agentNames: string[]): Promise<void> {
    const agentConfigs = {
      'backend-architect': {
        name: 'Backend Architect',
        role: 'API & Database Design',
        description: 'Designs RESTful APIs, database schemas, microservices architecture',
      },
      'ml-engineer': {
        name: 'ML Engineer',
        role: 'AI Models & Forecasting',
        description: 'Develops anomaly detection, demand forecasting, MLOps',
      },
      'frontend-dev': {
        name: 'Frontend Developer',
        role: 'Dashboard & UI',
        description: 'Builds Next.js components, real-time UI, data visualization',
      },
      'integration-engineer': {
        name: 'Integration Engineer',
        role: 'ERP Connectors',
        description: 'Develops SAP, Oracle, Dynamics, NetSuite, Odoo integrations',
      },
      'qa-devops': {
        name: 'QA/DevOps',
        role: 'Testing & Infrastructure',
        description: 'E2E testing, CI/CD, Infrastructure as Code',
      },
    };

    for (const agentName of agentNames) {
      const config = agentConfigs[agentName as keyof typeof agentConfigs];
      if (config) {
        this.agents.set(agentName, {
          name: config.name,
          role: config.role,
          status: 'idle',
        });
        logger.info(`Loaded agent: ${config.name}`);
      }
    }
  }

  /**
   * Setup API routes for orchestrator
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        commander: 'online',
        agents: Array.from(this.agents.entries()).map(([id, agent]) => ({
          id,
          name: agent.name,
          status: agent.status,
        })),
      });
    });

    // Plan feature (PM Agent)
    this.app.post('/plan/feature', async (req: Request, res: Response) => {
      const { description } = req.body;
      const result = await this.commander.planFeature(description);
      res.json(result);
    });

    // Analyze user feedback
    this.app.post('/analyze/feedback', async (req: Request, res: Response) => {
      const { feedback } = req.body;
      const result = await this.commander.analyzeUserFeedback(feedback);
      res.json(result);
    });

    // Get roadmap
    this.app.get('/roadmap', async (req: Request, res: Response) => {
      const { timeframe = 'all' } = req.query;
      const roadmap = await this.commander.generateRoadmap(timeframe as string);
      res.json(roadmap);
    });

    // Launch experiment
    this.app.post('/experiment', async (req: Request, res: Response) => {
      const experiment = req.body;
      const result = await this.commander.launchExperiment(experiment);
      res.json(result);
    });

    // Get metrics
    this.app.get('/metrics', async (req: Request, res: Response) => {
      const metrics = await this.commander.getMetrics();
      res.json(metrics);
    });

    // Delegate task to agent
    this.app.post('/delegate', async (req: Request, res: Response) => {
      const { agentName, task } = req.body;

      if (!this.agents.has(agentName)) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const agent = this.agents.get(agentName)!;
      agent.status = 'busy';
      agent.currentTask = task;

      // Coordinate with agent
      const result = await this.commander.coordinateWithAgent(agentName, task);

      res.json({
        agent: agent.name,
        task,
        status: 'delegated',
        result,
      });
    });

    // Get agent status
    this.app.get('/agents', (req: Request, res: Response) => {
      const agentList = Array.from(this.agents.entries()).map(([id, agent]) => ({
        id,
        name: agent.name,
        role: agent.role,
        status: agent.status,
        currentTask: agent.currentTask,
      }));

      res.json({ agents: agentList });
    });
  }

  /**
   * Start orchestrator server
   */
  async startServer(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        logger.info(`Orchestrator server running on port ${port}`);
        resolve();
      });
    });
  }

  /**
   * Delegate feature development to agent team
   */
  async delegateFeature(feature: {
    name: string;
    description: string;
    priority: string;
  }): Promise<void> {
    logger.info(`Delegating feature: ${feature.name}`);

    // Workflow: PM Agent -> Backend Architect -> ML Engineer -> Frontend Dev -> QA/DevOps

    // Step 1: Backend Architect designs API
    await this.commander.coordinateWithAgent('backend-architect', `Design API for ${feature.name}`);

    // Step 2: ML Engineer develops models (if needed)
    if (feature.name.includes('prediction') || feature.name.includes('forecast')) {
      await this.commander.coordinateWithAgent('ml-engineer', `Develop ML model for ${feature.name}`);
    }

    // Step 3: Frontend Developer builds UI
    await this.commander.coordinateWithAgent('frontend-dev', `Build UI for ${feature.name}`);

    // Step 4: Integration Engineer handles ERP connectors (if needed)
    if (feature.name.includes('ERP') || feature.name.includes('sync')) {
      await this.commander.coordinateWithAgent('integration-engineer', `Integrate ERP for ${feature.name}`);
    }

    // Step 5: QA/DevOps tests and deploys
    await this.commander.coordinateWithAgent('qa-devops', `Test and deploy ${feature.name}`);
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Agent Orchestrator...');
    this.agents.clear();
    await this.commander.shutdown();
  }
}
