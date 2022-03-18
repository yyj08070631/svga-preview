// 组件
// 工具
import { FC } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
// 自定义
import Home from './views/Home';
import './App.css';

const App: FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;
