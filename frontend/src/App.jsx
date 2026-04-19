import "./App.css";
import Hero from "./Component/HeroSection/HeroSection";
import Navbar from "./Component/Navbar/Navbar";
import HomeCard from "./page/HomeCard/HomeCard";

function App() {
  return (
    <div>
      <Navbar></Navbar>
      <Hero></Hero>
      <HomeCard></HomeCard>
    </div>
  );
}

export default App;
