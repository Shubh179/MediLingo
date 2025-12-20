import { HealthCheckResult, SystemHealth } from '../types/index.js';
import { checkDatabaseHealth } from '../config/database.js';
import { checkAWSServicesHealth } from '../config/aws.js';

export class HealthService {
  private static instance: HealthService;
  private healthChecks: Map<string, () => Promise<HealthCheckResult>> = new Map();

  private constructor() {
    this.registerDefaultHealthChecks();
  }

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  private registerDefaultHealthChecks(): void {
    // Database health check
    this.healthChecks.set('database', async (): Promise<HealthCheckResult> => {
      const startTime = Date.now();
      try {
        const dbHealth = await checkDatabaseHealth();
        return {
          service: 'database',
          status: dbHealth.isHealthy ? 'healthy' : 'unhealthy',
          responseTime: dbHealth.responseTime,
          details: { status: dbHealth.status },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          service: 'database',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
        };
      }
    });

    // AWS services health check
    this.healthChecks.set('aws', async (): Promise<HealthCheckResult> => {
      const startTime = Date.now();
      try {
        const awsHealth = await checkAWSServicesHealth();
        const allHealthy = awsHealth.textract && awsHealth.bedrock && awsHealth.s3;
        const someHealthy = awsHealth.textract || awsHealth.bedrock || awsHealth.s3;
        
        return {
          service: 'aws',
          status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
          responseTime: Date.now() - startTime,
          details: {
            textract: awsHealth.textract,
            bedrock: awsHealth.bedrock,
            s3: awsHealth.s3,
            errors: awsHealth.errors,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          service: 'aws',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
        };
      }
    });

    // Memory health check
    this.healthChecks.set('memory', async (): Promise<HealthCheckResult> => {
      const startTime = Date.now();
      try {
        const memUsage = process.memoryUsage();
        const totalMem = memUsage.heapTotal;
        const usedMem = memUsage.heapUsed;
        const memoryUsagePercent = (usedMem / totalMem) * 100;
        
        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (memoryUsagePercent > 90) {
          status = 'unhealthy';
        } else if (memoryUsagePercent > 75) {
          status = 'degraded';
        }
        
        return {
          service: 'memory',
          status,
          responseTime: Date.now() - startTime,
          details: {
            heapUsed: Math.round(usedMem / 1024 / 1024), // MB
            heapTotal: Math.round(totalMem / 1024 / 1024), // MB
            usagePercent: Math.round(memoryUsagePercent),
            external: Math.round(memUsage.external / 1024 / 1024), // MB
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          service: 'memory',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
        };
      }
    });
  }

  public registerHealthCheck(name: string, check: () => Promise<HealthCheckResult>): void {
    this.healthChecks.set(name, check);
  }

  public async checkHealth(serviceName?: string): Promise<HealthCheckResult | SystemHealth> {
    if (serviceName) {
      const healthCheck = this.healthChecks.get(serviceName);
      if (!healthCheck) {
        throw new Error(`Health check for service '${serviceName}' not found`);
      }
      return await healthCheck();
    }

    // Check all services
    const results: HealthCheckResult[] = [];
    const promises = Array.from(this.healthChecks.entries()).map(async ([name, check]) => {
      try {
        return await check();
      } catch (error) {
        return {
          service: name,
          status: 'unhealthy' as const,
          responseTime: 0,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
        };
      }
    });

    const healthResults = await Promise.all(promises);
    results.push(...healthResults);

    // Determine overall health
    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
    const degradedCount = results.filter(r => r.status === 'degraded').length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      services: results,
      timestamp: new Date(),
    };
  }

  public getRegisteredServices(): string[] {
    return Array.from(this.healthChecks.keys());
  }
}

// Export singleton instance
export const healthService = HealthService.getInstance();