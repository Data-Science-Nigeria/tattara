import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedsData1762168599106 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert permissions
    const permissions = [
      {
        name: 'user:read',
        description: 'Read user data',
        resource: 'user',
        action: 'read',
      },
      {
        name: 'user:write',
        description: 'Create and update user data',
        resource: 'user',
        action: 'write',
      },
      {
        name: 'user:delete',
        description: 'Delete user data',
        resource: 'user',
        action: 'delete',
      },

      {
        name: 'role:read',
        description: 'Read role data',
        resource: 'role',
        action: 'read',
      },
      {
        name: 'role:write',
        description: 'Create and update role data',
        resource: 'role',
        action: 'write',
      },
      {
        name: 'role:delete',
        description: 'Delete role data',
        resource: 'role',
        action: 'delete',
      },

      {
        name: 'permission:read',
        description: 'Read permission data',
        resource: 'permission',
        action: 'read',
      },
      {
        name: 'permission:write',
        description: 'Create and update permission data',
        resource: 'permission',
        action: 'write',
      },

      {
        name: 'data:read',
        description: 'Read collected data',
        resource: 'data',
        action: 'read',
      },
      {
        name: 'data:write',
        description: 'Create and update collected data',
        resource: 'data',
        action: 'write',
      },
      {
        name: 'data:export',
        description: 'Export collected data',
        resource: 'data',
        action: 'export',
      },

      {
        name: 'report:read',
        description: 'Read reports',
        resource: 'report',
        action: 'read',
      },
      {
        name: 'report:write',
        description: 'Create and update reports',
        resource: 'report',
        action: 'write',
      },
      {
        name: 'report:delete',
        description: 'Delete reports',
        resource: 'report',
        action: 'delete',
      },
    ];

    for (const perm of permissions) {
      await queryRunner.query(
        `INSERT INTO permissions (name, description, resource, action)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING`,
        [perm.name, perm.description, perm.resource, perm.action],
      );
    }

    // Create roles
    const roles = [
      {
        name: 'admin',
        description: 'Administrator with full access',
        permission_names: permissions.map(p => p.name),
      },
      {
        name: 'user',
        description: 'Data Collector with limited access',
        permission_names: [
          'user:read',
          'data:read',
          'data:write',
          'data:export',
          'report:read',
        ],
      },
    ];

    for (const role of roles) {
      await queryRunner.query(
        `INSERT INTO roles (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [role.name, role.description],
      );

      // Attach permissions
      for (const permName of role.permission_names) {
        await queryRunner.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT r.id, p.id
           FROM roles r, permissions p
           WHERE r.name = $1 AND p.name = $2
           ON CONFLICT DO NOTHING`,
          [role.name, permName],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove role-permission links
    await queryRunner.query(`DELETE FROM role_permissions`);

    // Remove roles
    await queryRunner.query(
      `DELETE FROM roles WHERE name IN ('admin', 'user')`,
    );

    // Remove permissions
    await queryRunner.query(`
      DELETE FROM permissions WHERE name IN (
        'user:read','user:write','user:delete',
        'role:read','role:write','role:delete',
        'permission:read','permission:write',
        'data:read','data:write','data:export',
        'report:read','report:write','report:delete'
      )
    `);
  }
}
