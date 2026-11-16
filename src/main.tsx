import { render } from 'preact';
import { App } from './app';
import './styles.css';
import { setupPwa } from './pwa';

render(<App />, document.getElementById('app')!);

setupPwa();
