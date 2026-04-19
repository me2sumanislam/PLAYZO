import "./App.css";
 
import Footer from "./Component/Footer/Footer";
import Hero from "./Component/HeroSection/HeroSection";
import Navbar from "./Component/Navbar/Navbar";
import HomeCard from "./page/HomeCard/HomeCard";

function App() {
  return (
    <div>
      <Navbar></Navbar>
      <Hero></Hero>
      <HomeCard></HomeCard>
     
      <Footer></Footer>
    </div>
  );
}

export default App;
