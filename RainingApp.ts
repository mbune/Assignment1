/** CSci-4611 Assignment 1 Support Code
 * Assignment concept and support code by Prof. Daniel Keefe, 2023
 * Inspired by Camille Utterbeck's "Text Rain" installation, 2000+
 * Copyright Regents of the University of Minnesota
 * Please do not distribute beyond the CSci-4611 course
 */

import * as gfx from 'gophergfx'
import { GUI, GUIController } from 'dat.gui'
import { VideoSourceManager } from './VideoSourceManager';
import { ImageUtils } from './ImageUtils';

export class RainingApp extends gfx.GfxApp {
    // --- constants ---
    private readonly FALLBACK_VIDEO = './TextRainInput.m4v';
    private readonly OPEN_SETTINGS_LABEL_TEXT = '▼ Open Settings';
    private readonly CLOSE_SETTINGS_LABEL_TEXT = '▲ Close Settings';


    // --- GUI related member vars ---
    // the gui object created using the dat.gui library.
    private gui: GUI;
    // the gui controllers defined in the constructor are tied to these member variables, so these
    // variables will update automatically whenever the checkboxes, sliders, etc. in the gui are changed.
    private _debugging: boolean;
    private _threshold: number;
    // the video source is also controlled by the GUI, but the logic is a bit more complex as we
    // do not know the names of the video devices until we are given permission to access them.  so,
    // we save a reference to the GUIController and option list in addition to the currentVideoDevice
    // variable that gets updated when the user changes the device via the gui.
    private videoSourceDropDown: GUIController;


    // --- Graphics related member vars ---
    private videoSourceManager: VideoSourceManager;
    private displayImage: ImageData | null;
    private obstacleImage: ImageData | null;
    private backgroundRect: gfx.Mesh2 | null;
    private raindropsParentNode: gfx.Node2;

    //====================================================================================================
    //Part 4.1 Select characters/words to display from some meaningful text (e.g., a poem, a song) 
    // that fits aesthetically with your vision for the user experience.


    //the word array that will be used to create the text rain
    private readonly wordArray = (
        `I never meant to cause you any sorrow
         I never meant to cause you any pain
         I only wanted one time to see you laughing
         I only wanted to see you
         Laughing in the purple rain
         Purple rain, purple rain
         I only want to see you
         Laughing in the purple rain`
    ).split(" ");
    //====================================================================================================

    // --- Getters and setters ---
    // any variables that can be changed from outside the class, including by the GUI, need to either be
    // declared public rather than private (this is usually faster to code and generally ok for small
    // projects) OR have getters & setters defined as below (this is generally better / safer practice).
    public get debugging() {
        return this._debugging;
    }

    public set debugging(value: boolean) {
        this._debugging = value;
    }

    public get threshold() {
        return this._threshold;
    }

    public set threshold(value: number) {
        this._threshold = value;
    }

    // --- Constructor ---
    // note: typescripts requires that we initialize all member variables in the constructor.
    constructor() {
        // initialize the base class gfx.GfxApp
        super();

        // this writes directly to some variables within the dat.gui library. the library does not
        // provide a nicer way to customize the text for the buttons used to open/close the gui.
        GUI.TEXT_CLOSED = this.CLOSE_SETTINGS_LABEL_TEXT;
        GUI.TEXT_OPEN = this.OPEN_SETTINGS_LABEL_TEXT;

        // initialize all member variables
        this._debugging = false;
        this._threshold = 0.5;
        this.displayImage = null;
        this.obstacleImage = null;
        this.backgroundRect = null;

        this.raindropsParentNode = new gfx.Node2();

        this.videoSourceManager = new VideoSourceManager(this.FALLBACK_VIDEO,
            // video sources are loaded asynchronously, and this little callback function
            // is called when the loading finishes to update the choices in the GUI dropdown
            (newSourceDictionary: { [key: string]: string }) => {
                this.videoSourceDropDown.options(newSourceDictionary);
            });

        // initialize the gui and add various controls
        this.gui = new GUI({ width: 300, closed: false });

        // create a dropdown list to select the video source; initially the only option is the
        // fallback video, more options are added when the VideoSourceManager is done loading
        const videoDeviceOptions: { [key: string]: string } = {};
        videoDeviceOptions[this.FALLBACK_VIDEO] = this.FALLBACK_VIDEO;
        this.videoSourceDropDown = this.gui.add(this.videoSourceManager, 'currentVideoSourceId', videoDeviceOptions);

        // this creates a checkbox for the debugging member variable
        const debuggingCheckbox = this.gui.add(this, 'debugging');

        // this creates a slider to set the value of the threshold member variable
        const thresholdSlider = this.gui.add(this, 'threshold', 0, 1);
    }

    // --- Initialize the Graphics Scene ---
    createScene(): void {
        // This parameter zooms in on the scene to fit within the window.
        // Other options include FIT or STRETCH.
        this.renderer.viewport = gfx.Viewport.CROP;

        // To see the texture to the scene, we need to apply it as a material to some geometry.
        // in this case, we'll create a big rectangle that fills the entire screen (width = 2, height = 2).
        this.backgroundRect = gfx.Geometry2Factory.createBox(2, 2);

        // Add all the objects to the scene--Order is important!
        // Objects that are added later will be rendered on top of objects that are added first.
        this.scene.add(this.backgroundRect);
        this.scene.add(this.raindropsParentNode);
        
    }


    // --- Update routine called once each frame by the main graphics loop ---
    update(deltaTime: number): void {
        const latestImage = this.videoSourceManager.currentVideoSource.getImageData();

        // 2 sceen units in 0.5 seconds
        const speed = -2 / 1;
        const deltaPos = speed * deltaTime;
        this.raindropsParentNode.position.y = this.raindropsParentNode.position.y + deltaPos;
        if (this.raindropsParentNode.position.y < -1.2) {
            this.raindropsParentNode.position.y = 1.2;
        }

        if (latestImage instanceof ImageData) {

            const width = latestImage.width;
            const height = latestImage.height;

            this.displayImage = ImageUtils.createOrResizeIfNeeded(this.displayImage, width, height);
            this.obstacleImage = ImageUtils.createOrResizeIfNeeded(this.obstacleImage, width, height);

            if (this.displayImage instanceof ImageData && this.obstacleImage instanceof ImageData) {

                // At this point, we know latestImage, this.displayImage, and this.obstacleImage are all
                // created and have the same width and height.  The pixels in latestImage will contain the
                // latest data from the camera and this.displayImage and this.obstacleImage are both
                // blank images (all pixels are black).

                //====================================================================================================
                //TODO: Part 2 Image Processing
                //Uncomment the following code and provide the appropriate parameters after completing the functions for Part 2
                //ImageUtils.mirror();
                //ImageUtils.convertToGrayscaleInPlace();
                //ImageUtils.threshold();

                //Remove the following line after completing Part 2
                ImageUtils.copyPixels(latestImage, this.displayImage);
                //====================================================================================================

                // Texture the backgroundRect with either the displayImage or the obstacleImage
                if (this.backgroundRect instanceof gfx.Mesh2) {
                    let imageToDraw = this.displayImage;

                    if (this.debugging) {
                        imageToDraw = this.obstacleImage;
                    }

                    if (this.backgroundRect.material.texture == null ||
                        this.backgroundRect.material.texture.width != width ||
                        this.backgroundRect.material.texture.height != height) {
                        // We need to create a new texture and assign it to our backgroundRect
                        this.backgroundRect.material.texture = new gfx.Texture(imageToDraw);
                    } else {
                        // Otherwise, the appropriate texture already exists and we need to update its pixel array
                        this.backgroundRect.material.texture.setFullImageData(imageToDraw);
                    }
                }

                //====================================================================================================
                //TODO: Part 1.2 Raindrop Spawning
                //In order to prevent infinite raindrops, we will want to limit the total number of raindrops.
                //We may also want to wait a certain amount of time between spawning raindrops--remember that update runs every frame.

                this.spawnRaindrop();
                //====================================================================================================
                
                
                
                //====================================================================================================
                //TODO: Part 1.3 Basic Rain Animation & Recycling
                //Iterate through each raindrop and position it according to its velocity and deltaTime assuming nothing is in its way
                //Then we should check if the raindrop has fallen off of the screen and needs to be removed or repositioned
                

                const raindropVelocity = new gfx.Vector2(0,-0.25);
                // ADD YOUR CODE HERE
                
                //====================================================================================================


                //====================================================================================================
                //TODO: Part 3.2 Convert Coordinates
                //convert the raindrop's position to a col,row within the image using the appropriate functions

                // ADD YOUR CODE HERE

                //====================================================================================================


                //====================================================================================================
                //TODO: Part 3.3 Respond to Obstacles
                // Iterate through each raindrop and check if it encounters an obstacle
                // First, we need to make sure the raindrop is over the image (if not, we can assume it is off screen)
                // Then, we need to check if the obstacleImage at the raindrop's position is a dark region 
                //(the helper functions in Image Utils may be useful)
                // If it is, we should keep the raindrop from falling any further

                // ADD YOUR CODE HERE

                //====================================================================================================

                //====================================================================================================
                //TODO: Part 3.4 Advanced Response to Obstacles
                // Extend or modify the logic from Part 3.3 to push the raindrop above dark regions
                // Raindrops will need to move up and down as the video changes to respond to obstacles 

                // ADD YOUR CODE HERE

                //====================================================================================================
            
                //====================================================================================================
                //TODO: Part 4.2 Advanced Obstacle Animation
                // Add at least one animation to the raindrops, background image, or another object
                // that occurs when the letters encounter obstacles

                //====================================================================================================
            

            }
        }
    }

    // --- Additional Class Member Functions ---
 
    private spawnRaindrop(): void {
        //====================================================================================================
        //TODO: PART 1.1 Raindrop Creation
        //We should choose a random word from the wordList
        //For each letter in the word, we need to spawn a raindrop geometry on the appropriate node
        //At random locations along the X-axis and at the appropriate Y-axis position 
        //We need to apply a Text texture to the raindrop material using the current letter

        // ADD YOUR CODE HERE

        const rain = gfx.Geometry2Factory.createBox(0.1,0.1)
        this.rain.material.texture = new gfx.Text('H', 64, 64, '48x Helvetica')
        this.rain.material.color = gfx.Color.GREEN;
        //this.rain.position = new gfx.Vector2(0.1, 0.5);
        this.sceneXtoImageColumn.add(this.rain);



        /*
        for(let entry of this.wordArray){
            const randomX = 50; 
            const fixedY = 50; 
            const t = 0;

            const letter = gfx.Text.text(entry);
            this.raindropsParentNode = gfx.Geometry2Factory.createBox(0.1,0.1);
            this.raindropsParentNode.material.texture = new gfx.Text(letter)
            this.scene.add(this.raindropsParentNode)
        }
        */

        //====================================================================================================
    }

    //====================================================================================================
    //TODO: Part 3.1 Scene <-> Image Coordinate Conversion
    //Complete the following four functions to convert between scene coordinates and image coordinates
    sceneXtoImageColumn(x: number, imageWidth: number) : number {
        return 0;
    }

    sceneYtoImageRow(y: number, imageHeight: number): number  {
        return 0;
    }

    imageColumnToSceneX(col: number, imageWidth: number): number  {
        return 0;
    }

    imageRowToSceneY(row: number, imageHeight: number): number  {
        return 0;
    }
    //====================================================================================================
}
