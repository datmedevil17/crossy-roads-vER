import { Map } from "./components/Map"
import Player from "./components/Player"
import Scene from "./components/Scene"
import { Controls } from "./components/Controls";
import "./Game.css";
import { Score } from "./components/Score";
import { Result } from "./components/Result";

const Game = () => {
  return (
    <div className="game">
      <Scene>
        <Player/>
        <Map/>
      </Scene>
      <Score/>
      <Controls/>
      <Result/>
    </div>
  )
}

export default Game
