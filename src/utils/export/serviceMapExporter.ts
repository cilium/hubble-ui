import { ServiceCard } from '~/domain/service-map/card';
import { Link } from '~/domain/link';
import { ExportedConnection, ExportedServiceMap } from './types';

export class ServiceMapExporter {
  /**
   * Exports service map connections to JSON format
   */
  public static exportToJSON(
    services: Map<string, ServiceCard>,
    links: Link[],
  ): ExportedServiceMap {
    const connections: ExportedConnection[] = [];
    let skippedLinks = 0;

    console.log('[ServiceMapExporter] Starting export...', {
      totalServices: services.size,
      totalLinks: links.length,
    });

    for (const link of links) {
      const sourceService = services.get(link.sourceId);
      const destService = services.get(link.destinationId);

      // Skip if we can't find either service
      if (!sourceService || !destService) {
        skippedLinks++;
        console.warn('[ServiceMapExporter] Skipping link - service not found:', {
          sourceId: link.sourceId,
          destId: link.destinationId,
          sourceFound: !!sourceService,
          destFound: !!destService,
        });
        continue;
      }

      const latency = link.throughput.latency;
      connections.push({
        source: {
          id: link.sourceId,
          name: sourceService.caption,
          namespace: sourceService.namespace,
        },
        destination: {
          id: link.destinationId,
          name: destService.caption,
          namespace: destService.namespace,
        },
        destinationPort: link.destinationPort,
        ipProtocol: link.ipProtocol.toString(),
        verdicts: Array.from(link.verdicts).map(v => v.toString()),
        authTypes: Array.from(link.authTypes).map(a => a.toString()),
        isEncrypted: link.isEncrypted,
        throughput: {
          flowAmount: link.throughput.flowAmount,
          latency: latency
            ? {
                min: Number(latency.min.seconds),
                max: Number(latency.max.seconds),
                avg: Number(latency.avg.seconds),
              }
            : null,
          bytesTransfered: link.throughput.bytesTransfered,
        },
      });
    }

    // Calculate unique services involved in connections
    const uniqueServiceIds = new Set<string>();
    connections.forEach(conn => {
      uniqueServiceIds.add(conn.source.id);
      uniqueServiceIds.add(conn.destination.id);
    });

    const result = {
      exportedAt: new Date().toISOString(),
      connections,
      summary: {
        totalConnections: connections.length,
        totalServices: uniqueServiceIds.size,
      },
    };

    console.log('[ServiceMapExporter] Export complete:', {
      exportedConnections: result.summary.totalConnections,
      uniqueServices: result.summary.totalServices,
      skippedLinks,
      timestamp: result.exportedAt,
    });

    // Log sample connections for verification
    if (connections.length > 0) {
      console.log('[ServiceMapExporter] Sample connections (first 3):',
        connections.slice(0, 3).map(c => ({
          from: `${c.source.name} (${c.source.namespace})`,
          to: `${c.destination.name} (${c.destination.namespace})`,
          port: c.destinationPort,
          protocol: c.ipProtocol,
          encrypted: c.isEncrypted,
        }))
      );
    }

    return result;
  }

  /**
   * Downloads the exported data as a JSON file
   */
  public static downloadJSON(data: ExportedServiceMap, filename?: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `hubble-service-map-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  }

  /**
   * Exports and downloads service map connections in one operation
   */
  public static export(services: Map<string, ServiceCard>, links: Link[]): void {
    const data = this.exportToJSON(services, links);
    this.downloadJSON(data);
  }
}
