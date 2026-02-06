import { DataSource } from 'typeorm';

export async function clearAllTables(dataSource: DataSource): Promise<void> {
  await dataSource.query('DELETE FROM vinculo_sujeto_objeto');
  await dataSource.query('DELETE FROM automotores');
  await dataSource.query('DELETE FROM objeto_de_valor');
  await dataSource.query('DELETE FROM sujeto');
}
