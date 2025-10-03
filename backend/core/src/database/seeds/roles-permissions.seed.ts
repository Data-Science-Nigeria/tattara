import { DataSource } from 'typeorm';
import { Permission, Role } from '../entities';

export class RolesPermissionsSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepository = dataSource.getRepository(Permission);
    const roleRepository = dataSource.getRepository(Role);

    // Create permissions
    const permissions = [
      // User permissions
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

      // Role permissions
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

      // Permission permissions
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

      // Data collection permissions (for data collector role)
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

      // Report permissions
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

    const createdPermissions: Permission[] = [];
    for (const permData of permissions) {
      let permission = await permissionRepository.findOne({
        where: { name: permData.name },
      });
      if (!permission) {
        permission = permissionRepository.create(permData);
        permission = await permissionRepository.save(permission);
      }
      createdPermissions.push(permission);
    }

    // Create roles with permissions
    const roleConfigs = [
      {
        name: 'admin',
        description: 'Administrator with full access',
        permissionNames: [
          'user:read',
          'user:write',
          'user:delete',
          'role:read',
          'role:write',
          'role:delete',
          'permission:read',
          'permission:write',
          'data:read',
          'data:write',
          'data:export',
          'report:read',
          'report:write',
          'report:delete',
        ],
      },
      {
        name: 'user',
        description: 'Data Collector with limited access',
        permissionNames: [
          'user:read', // Can read their own profile
          'data:read',
          'data:write',
          'data:export', // Can manage data collection
          'report:read', // Can read reports
        ],
      },
    ];

    for (const roleConfig of roleConfigs) {
      let role = await roleRepository.findOne({
        where: { name: roleConfig.name },
        relations: ['permissions'],
      });

      const rolePermissions = createdPermissions.filter(p =>
        roleConfig.permissionNames.includes(p.name),
      );

      if (!role) {
        role = roleRepository.create({
          name: roleConfig.name,
          description: roleConfig.description,
          permissions: rolePermissions,
        });
        await roleRepository.save(role);
        console.log(`Created role: ${roleConfig.name}`);
      } else {
        // Update permissions if role exists
        role.permissions = rolePermissions;
        await roleRepository.save(role);
        console.log(`Updated permissions for role: ${roleConfig.name}`);
      }
    }

    console.log('Roles and permissions seeded successfully!');
  }
}
