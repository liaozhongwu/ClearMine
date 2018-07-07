import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';

interface GameParams {
  row: number; // row count of cell
  col: number; // col count of cell
  bomb: number; // bomb count
}

interface GameState {
  flag: number; // flag count
  remain: number; // remain bomb
}

const enum GameStatus {
  PLAYING = 1,
  WIN = 2,
  FAIL = 3,
}

interface Position {
  x: number;
  y: number;
}

class Cell {
  private value: number;
  private status: CellStatus;

  constructor(value?: number, status?: CellStatus) {
    this.value = value || 0;
    this.status = status || CellStatus.COVER;
  }

  /**
   * @description set cell is bomb
   */
  setBomb(): void {
    this.value = -1;
  }

  getValue(): number {
    return this.value;
  }

  /**
   * @description get cell is bomb or not
   */
  isBomb(): boolean {
    return this.value === -1;
  }

  /**
   * @description 
   */
  isEmpty(): boolean {
    return this.value === 0;
  }

  /**
   * @description value up
   */
  valueUp(): void {
    this.value += 1;
  }

  /**
   * @description get cell status
   */
  getStatus(): CellStatus {
    return this.status;
  }

  /**
   * @description this cell is covered
   */
  isCover(): boolean {
    return this.status === CellStatus.COVER;
  }

  /**
   * @description this cell is showed
   */
  isShow(): boolean {
    return this.status === CellStatus.SHOW;
  }

  /**
   * @description this cell is flagged
   */
  isFlag(): boolean {
    return this.status === CellStatus.FLAG;
  }

  /**
   * @description show this cell
   */
  show(): void {
    this.status = CellStatus.SHOW;
  }

  /**
   * @description flag this cell
   */
  flag(): void {
    this.status = CellStatus.FLAG;
  }

  /**
   * @description not flag this cell
   */
  cancelFlag(): void {
    this.status = CellStatus.COVER;
  }
}

const enum CellStatus {
  COVER = 1, // cover(initial)
  SHOW = 2, // show
  FLAG = 3, // flag as a bomb
}

interface IProps {}

interface IState {
  params: GameParams;
  grid: Cell[][];
  showEmptyBlocks: boolean;
}

export default class Game extends React.Component<IProps, IState> {
  public showEmptyBlocksTimeout: number | null = null;

  constructor(props: IProps) {
    super(props);
    const params = {
      row: 16,
      col: 30,
      bomb: 99,
    };
    this.state = {
      params,
      grid: this.createGrid(params),
      showEmptyBlocks: false,
    }
  }

  restart() {
    const { params } = this.state;
    this.setState({ grid: this.createGrid(params) });
  }

  /**
   * @description create new grid data
   * @param payload game data
   */
  createGrid(params: GameParams): Cell[][] {
    // create initial grid
    const { row, col, bomb } = params;
    const data: Cell[][] = [];
    for (let i = 0; i < row; ++i) {
      data[i] = [];
      for (let j = 0; j < col; ++j) {
        data[i][j] = new Cell();
      }
    }
    // random bomb
    let bombCount = 0;
    while(bombCount < bomb) {
      const x = Math.floor(Math.random() * row);
      const y = Math.floor(Math.random() * col);
      if (!data[x][y].isBomb()) {
        data[x][y].setBomb();
        bombCount++;
      }
    }
    // calc non-bomb digit
    for (let i = 0; i < row; ++i) {
      for (let j = 0; j < col; ++j) {
        if (data[i][j].isBomb()) {
          continue;
        }
        // get linked cell count which is bomb
        for (let k = Math.max(0, i - 1); k < Math.min(row, i + 2); ++k) {
          for (let l = Math.max(0, j - 1); l < Math.min(col, j + 2); ++l) {
            if (data[k][l].isBomb()) {
              data[i][j].valueUp();
            }
          }
        }
      }
    }
    return data;
  };

  /**
   * @description handle click cell
   * @param position position of cell
   */
  handleClickCell(position: Position) {
    const { grid } = this.state;
    const cell = grid[position.x][position.y];
    if (cell.isShow()) {
      return;
    }
    // if it's a empty cell, show all cell linked
    if (cell.isEmpty()) {
      this.showLinkedEmptyCell(position, []);
    } else if (!cell.isFlag()) {
      cell.show();
    }
    this.setState({ grid });
    const status = this.getGameStatus();
    if (status === GameStatus.FAIL || status === GameStatus.WIN) {
      this.showAllCells();
    }
  }

  /**
   * @description handle right click cell
   */
  handleRightClickCell(position: Position) {
    const { grid } = this.state;
    const cell = grid[position.x][position.y];
    if (cell.isShow()) {
      return;
    }
    if (cell.isFlag()) {
      cell.cancelFlag();
    } else {
      cell.flag();
    }
    this.setState({ grid });
  }

  /**
   * @description show all cell
   */
  showAllCells() {
    const { params, grid } = this.state;
    for (let i = 0; i < params.row; ++i) {
      for (let j = 0; j < params.col; ++j) {
        const cell = grid[i][j];
        cell.show();
      }
    }
    this.setState({ grid });
  }

  /**
   * @description 
   * @param position position of cell
   * @param historyPositions position of cells which has been visited in this recursion
   */
  showLinkedEmptyCell(position: Position, historyPositions: Position[]) {
    const { params, grid } = this.state;
    const { row, col } = params;
    const { x, y } = position;
    for (let i = Math.max(0, x - 1); i < Math.min(row, x + 2); ++i) {
      for (let j = Math.max(0, y - 1); j < Math.min(col, y + 2); ++j) {
        const nextPosition = { x: i, y: j };
        const existed = historyPositions.find(tPosition => tPosition.x === i && tPosition.y === j);
        if (existed) {
          continue;
        }
        historyPositions.push(nextPosition);
        if (!grid[i][j].isBomb()) {
          grid[i][j].show();
          // if linked cell is empty, do recursion
          if (grid[i][j].isEmpty()) {
            this.showLinkedEmptyCell(nextPosition, historyPositions);
          }
        }
      }
    }
  }

  /**
   * @description get current game state
   */
  getCurrentGameState(): GameState {
    let flag = 0;
    const { params, grid } = this.state;
    for (let i = 0; i < params.row; ++i) {
      for (let j = 0; j < params.col; ++j) {
        const cell = grid[i][j];
        if (cell.isFlag()) {
          flag++;
        }
      }
    }
    return { flag, remain: params.bomb - flag };
  }

  /**
   * @description get current game status
   */
  getGameStatus(): GameStatus {
    let status = GameStatus.WIN;
    const { params, grid } = this.state;
    for (let i = 0; i < params.row; ++i) {
      for (let j = 0; j < params.col; ++j) {
        const cell = grid[i][j];
        if (cell.isBomb() && cell.isShow()) {
          return GameStatus.FAIL;
        } else if (!cell.isBomb() && !cell.isShow()) {
          status = GameStatus.PLAYING;
        }
      }
    }
    return status;
  }

  /**
   * @description hint the empty blocks
   */
  hintEmptyBlocks() {
    this.setState({ showEmptyBlocks: true });
    if (this.showEmptyBlocksTimeout) {
      window.clearTimeout(this.showEmptyBlocksTimeout);
    }
    this.showEmptyBlocksTimeout = window.setTimeout(() => {
      this.setState({ showEmptyBlocks: false });
    }, 3000);
  }

  /**
   * @description render grid
   */
  renderGrid() {
    const { grid, showEmptyBlocks } = this.state;
    return (
      <div className="grid">
        {
          grid.reduce((nodes: React.ReactNode[], row, i) => {
            return nodes.concat(
              <div className="row">
                {row.map((cell, j) => {
                  let className = 'cell';
                  const content: React.ReactNode = (() => {
                    if (cell.isCover()) {
                      if (showEmptyBlocks && cell.isEmpty()) {
                        return <div className="cover hint"></div>;
                      }
                      return <div className="cover"></div>;
                    } else if (cell.isFlag()) {
                      return <div className="flag"></div>;
                    } else if (cell.isShow()) {
                      if (cell.isBomb()) {
                        return 'x';
                      } else if (cell.isEmpty()) {
                        return '';
                      } else {
                        return cell.getValue();
                      }
                    }
                  })();
                  const position = { x: i, y: j };
                  return (
                    <div
                      className={className}
                      onClick={() => {
                        this.handleClickCell(position);
                      }}
                      onContextMenu={e => {
                        e.preventDefault();
                        this.handleRightClickCell(position);
                      }}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            );
          }, [])
        }
      </div>
    )
  }

  /**
   * @description main render
   */
  render() {
    const gameState = this.getCurrentGameState();
    return (
      <div className="game">
        <div className="header">
          <button className="btn" onClick={() => this.restart()}>开始游戏</button>
          <button className="btn" onClick={() => this.hintEmptyBlocks()}>空白区域</button>
          剩余雷数: { gameState.remain }
        </div>
        { this.renderGrid() }
      </div>
    );
  }
}

ReactDOM.render(<Game />, document.getElementById('app'));
