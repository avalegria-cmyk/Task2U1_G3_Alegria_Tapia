# Deployment and recovery

## Where to deploy

The primary target is an existing university Linux server or virtual machine with Docker Engine and Docker Compose. A cloud Linux VM can run the same Compose stack as an alternative or recovery host. Choose server resources from measured enrollment traffic and database size; no capacity benchmark is claimed by this project.

The supplied stack runs all application services in containers: Nginx, PHP-FPM, PostgreSQL, and a PHP notification worker. Node and Composer run only during builds; seed and test services run on demand. This deployment model follows Docker's [single-server Compose guidance](https://docs.docker.com/compose/how-tos/production/).

## Local or institutional demonstration

1. Copy this repository to the host and install Docker with the Compose plugin.
2. Create `.env` from `.env.example` and configure unique credentials.
3. Run `docker compose up -d --build --wait`.
4. For demonstration data, run `docker compose --profile tools run --rm seed`.
5. Access `http://localhost:8080` on that host. The default bind address is loopback.

If 8080 is occupied, change `APP_PORT` in `.env` and recreate the web service. To intentionally expose the demonstration to a trusted LAN, set `APP_BIND` to that host's LAN address and restrict access with its firewall.

## Public deployment requirements

Before handling real student data, terminate HTTPS at the institution's existing gateway/load balancer or a containerized TLS proxy. Keep the application port reachable only by that gateway. Do not expose PostgreSQL or PHP-FPM ports. The supplied Nginx configuration listens for internal HTTP; it does not provision certificates or a public domain.

Use independently provisioned accounts and unique credentials instead of shared demo accounts. The demonstration Compose configuration uses the PostgreSQL bootstrap account for the API; production must separate schema administration from a restricted application database role. Store secrets through the institution's deployment secret facility, establish account/password administration, and disable demo seeding. Add monitoring for failed logins, worker failures, disk usage, backup age and `/api/health`.

Build and test images before promotion, record immutable image digests, and keep the previous release for rollback. Compose restart policies restart exited processes; health-check failure alone is not automatic failover. This repository has not been published to a remote server.

## Backup and restore

Create a logical backup from the running database without exposing its password:

```sh
docker compose exec -T database sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > academic-manager.dump
```

Store backups on a separate host under institutional retention and encryption policies. Test restoration periodically.

For restoration into a replacement environment, start its database, stop API/worker/web writers, and restore the selected backup. The following command replaces database objects; run it only against the intended recovery database:

```sh
docker compose stop web api worker
docker compose exec -T database sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < academic-manager.dump
docker compose up -d --wait
```

Reusing the same database credentials in a new `.env` is not required if ownership is handled appropriately. Changing `.env` credentials on an existing PostgreSQL volume does not automatically change database users or passwords. Rotate the JWT secret on recovery to invalidate old sessions when appropriate.

## Updates and scale

Back up the database, build the new images, review the forward migrations, and run `docker compose up -d --build --wait`. The initial SQL file runs only on an empty volume; the one-shot `migrate` service applies pending versioned migrations before the API and worker start. Do not remove a populated volume to apply schema changes.

A second cloud host with restored backups provides manual disaster recovery. It is not live redundancy: recovery point and recovery time depend on backup frequency and restore procedures. Automatic failover would require database replication, traffic switching, secret synchronization, health monitoring and rehearsed recovery. Larger deployments can extract services or introduce a broker after measuring bottlenecks; the current implementation remains a layered monolith.
