import React from "react"
import {Link} from "react-router-dom";


import PictureGallery from "../components/pictureGallery.js"
import "./styles/landingPage.scss"

import pic1 from "../images/img_5terre_wide.jpeg"
import pic2 from "../images/img_lights_wide.jpeg"
import pic3 from "../images/img_mountains_wide.jpeg"
import pic4 from "../images/img_nature_wide.jpeg"
import pic5 from "../images/img_snow_wide.jpeg"
import pic6 from "../images/img_woods_wide.jpeg"

const images = [pic1,pic2,pic3,pic4,pic5,pic6]

class LandingPage extends React.Component{

  render(){
    return (

      <div className="landingPage-container">
        <header>
        </header>
        <main>
          <PictureGallery images={images}/>
          <div className="landingPage-title">
            <h1>Monique & Liam</h1>
            <h2><em>are getting married!</em></h2>
            <div className="landingPage-date-container">
              <h3>27/05/2022</h3>
              <h3 className="landingPage-RSVP-button"><Link to="/rsvp">RSVP</Link></h3>
            </div>
          </div>
        </main>
        <footer>
        </footer>

      </div>
    );
  }

}

export default LandingPage
