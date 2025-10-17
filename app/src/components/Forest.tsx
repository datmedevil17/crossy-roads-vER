import { Grass } from "./Grass";
import { Tree } from "./Tree";
interface TreeData {
  tileIndex: number;
  height: number;
}

// Define the row data structure
interface RowData {
  trees: TreeData[];
}

export function Forest({ rowIndex, rowData }: { rowIndex: number; rowData: RowData }) {
  return (
    <Grass rowIndex={rowIndex}>
      {rowData.trees.map((tree: TreeData, index: number) => (
        <Tree
          key={index}
          tileIndex={tree.tileIndex}
          height={tree.height}
        />
      ))}
    </Grass>
  );
}