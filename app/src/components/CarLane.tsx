import { Road } from "./Road";
import { Car } from "./Car";

type Vehicle = {
  initialTileIndex: number;
  color: string;
};

type RowData = {
  vehicles: Vehicle[];
  direction: boolean;
  speed: number;
};

interface CarLaneProps {
  rowIndex: number;
  rowData: RowData;
}

export function CarLane({ rowIndex, rowData }: CarLaneProps) {
  return (
    <Road rowIndex={rowIndex}>
      {rowData?.vehicles?.map((vehicle, index) => (
        <Car
          key={index}
          rowIndex={rowIndex}
          initialTileIndex={vehicle.initialTileIndex}
          direction={rowData.direction}
          speed={rowData.speed}
          color={vehicle.color}
        />
      )) || null}
    </Road>
  );
}