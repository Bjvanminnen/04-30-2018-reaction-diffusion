import React from 'react';
import ReactionDiffusion from './ReactionDiffusion';

export default class App extends React.Component {
  render() {
    return (
      <div>
        <ReactionDiffusion
          feed={0.08}
          kill={0.065}
          width={1024}
          height={768}
        />
        {/*<ReactionDiffusion
          feed={0.045}
          kill={0.062}
        />*/}
      </div>
    );
  }
}
