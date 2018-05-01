import React from 'react';
import drawRegl from './drawRegl';

export default class ReglApp extends React.Component {
  state = {
    colors: []
  }

  componentDidMount() {
    drawRegl(this.canvas, this.updateColors);
  }

  updateColors = colors => {
    this.setState({colors});
  }

  render() {
    return (
      <div>
        <canvas
          ref={e => this.canvas = e}
          width="200"
          height="200"
          style={{
            margin: 20,
            padding: 10,
            border: '1px solid black',
            display: 'inline-block',
          }}
        />
        <div>
          {this.state.colors.map((color, key) =>
            <div key={key} style={{
              width: 10,
              height: 10,
              backgroundColor: color,
              display: 'inline-block'
            }}/>
          )}
        </div>
        <pre>
          {(this.state.colors).join('\n')}
        </pre>
      </div>
    );
  }
}
