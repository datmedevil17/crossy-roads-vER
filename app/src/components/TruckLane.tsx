import { Road } from "./Road";
import { Truck } from "./Truck";

interface TruckData {
  initialTileIndex: number;
  color: string | number;
}

interface TruckLaneProps {
  rowIndex: number;
  rowData: {
    trucks: TruckData[];
    direction: boolean;
    speed: number;
  };
}

export function TruckLane({ rowIndex, rowData }: TruckLaneProps) {
  return (
    <Road rowIndex={rowIndex}>
      {rowData?.trucks?.map((truck: TruckData, index: number) => (
        <Truck
          key={index}
          rowIndex={rowIndex}
          initialTileIndex={truck.initialTileIndex}
          direction={rowData.direction}
          speed={rowData.speed}
          color={truck.color}
        />
      )) || null}
    </Road>
  );
}