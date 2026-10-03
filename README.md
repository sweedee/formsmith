# Formsmith

A browser voxel puzzle prototype built with Three.js, TypeScript and Vite.

## Run

Use Node.js 24 or newer. Run `npm install`, then `npm run dev`.
`npm test` checks the voxel evaluator; `npm run build` validates TypeScript and creates `dist/`.

## Play

Recreate the target on the left in the construction area on the right. Choose Block, Socket, Stamp or Erase from the left tool rail (keys 1–4). Left-click a face to build; Shift-click or right-click removes a source placement. Drag to orbit, middle-drag to pan, scroll to zoom. Missing voxels are blue wireframes; extras are red. Choose levels from the commission button at the top, or use the previous/next arrows. Progress is displayed above the scene.

Choose **Anywhere in 3D** (G) to place floating or overlapping shapes. Drag the red/green/blue cursor handles, click the horizontal plane, or enter X/Y/Z coordinates. Press **Place at cursor** or Enter to place. Arrow keys move X/Z; Page Up/Down move Y. Clicks in this mode position the cursor instead of committing a placement. Occupied positions are allowed. In face mode, Alt-click a shape to overlap a new placement at its source anchor.

Create a named template using **New template**, place input sockets or fixed blocks on its workbench, then choose **Back to level**. The asset shelf displays previews of evaluated shapes. Click an asset to stamp it; choose **Edit shape** to edit its definition. The contextual **Shape input** button opens a visual picker for what fills sockets. Rotate with the rotation button or R. Shape origins are the grid axes. Editing templates updates their instances and asset thumbnails. Undo/redo applies to construction and library changes.

Libraries and the active build save in this browser. Export/import provides portable library backups; import replaces the library and clears the active construction (undo restores it).

Prototype prices: direct block 10; template invocation 2; local definition 8 + 2 per recipe element. Transitive definitions are charged once. Costs are provisional.

## Deployment

The Pages workflow tests and builds pushes to main, then publishes the static artifact. Relative asset paths support repository hosting. See PLAN.md for staged design and checkpoints.

## Current limits

Controls are designed for desktop mouse/keyboard. Workbenches use spatial grids with screen-based tool controls; fully world-embedded controls remain a later interaction pass. No slicing view or running transformations yet. Outputs are capped at 20,000 voxels. Removing a generated voxel removes its whole source instance. Global shapes persist locally rather than in an account.
