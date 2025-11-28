import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.bundle.js'
import '../css/main.css'
import $ from 'jquery'

// TypeScript entry point for Forex App
$(function() {
  console.log('Forex App initialized with TypeScript!')
  
  $('#testBtn').on('click', function() {
    alert('TypeScript is working!')
  })
})
