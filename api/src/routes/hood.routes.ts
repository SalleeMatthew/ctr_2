import Router from 'express';

import {hoodController} from '../controllers';

const hoodRoutes = Router();

hoodRoutes.get('/:id/blocks', (request, response) => hoodController.getBlocks(request, response));
hoodRoutes.get('/:id', (request, response) => hoodController.getHood(request, response));
hoodRoutes.get('/:id/can_admin', (request, response) => hoodController.canAdmin(request, response));
hoodRoutes.get('/:id/can_manage_access', (request, response) =>
  hoodController.canManageAccess(request, response),
);
hoodRoutes.get('/:id/getAccessInfo', (request, response) =>
  hoodController.getAccessInfoByUsername(request, response),
);
hoodRoutes.post('/:id/postAccessInfo', (request, response) =>
  hoodController.postAccessInfo(request, response),
);
export { hoodRoutes };
