import React from 'react';
import {GeoJSON} from 'react-leaflet';
import basemap from './heritage-basemap.json';

const basemapStyles={
 land:{color:'#aca78e',weight:1,fillColor:'#eee8d5',fillOpacity:1},
 lake:{color:'#a1b5b0',weight:1,fillColor:'#d9e5e2',fillOpacity:1},
 river:{color:'#a1b5b0',weight:1,opacity:0.8}
};
const basemapStyle=feature=>basemapStyles[feature.properties.kind];

export default function HeritageBasemap(){
 return <GeoJSON data={basemap} style={basemapStyle} interactive={false} attribution='<a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a>'/>;
}
