import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

// Increase timeout for container startup
jest.setTimeout(60000);

let postgresContainer: StartedPostgreSqlContainer;

interface TestDbConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export const getTestDbConfig = (): TestDbConfig => ({
  host: postgresContainer.getHost(),
  port: postgresContainer.getPort(),
  database: postgresContainer.getDatabase(),
  username: postgresContainer.getUsername(),
  password: postgresContainer.getPassword(),
});

beforeAll(async () => {
  // Start PostgreSQL container
  postgresContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();
});

afterAll(async () => {
  if (postgresContainer) {
    await postgresContainer.stop();
  }
});
