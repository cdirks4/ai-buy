javascript: (function () {
  console.log("Starting messenger observer...");

  // Target the specific message container class
  const messagesContainer = document.querySelector(
    ".x1ja2u2z.x9f619.x78zum5.xdt5ytf.x193iq5w.x1l7klhg.x1iyjqo2.xs83m0k.x2lwn1j.x6prxxf.x85a59c.x1n2onr6.xjbqb8w.xuce83p.x1bft6iq.xczebs5"
  );

  // Log what we found
  console.log("Found messages container:", messagesContainer);

  if (!messagesContainer) {
    // Add more detailed error logging
    console.error("Could not find messages container. DOM state:", {
      allClasses: document.querySelector('*[class*="x1ja2u2z"]'),
      bodyHTML: document.body.innerHTML.substring(0, 500) + "...",
      possibleContainers: document.querySelectorAll('div[role="main"]'),
    });
    return;
  }

  // Function to send image to API
  async function sendImageToAPI(imageUrl) {
    try {
      // Extract image metadata including location
      const img = new Image();
      const metadata = await new Promise((resolve) => {
        img.onload = () => {
          const meta = {
            width: img.width,
            height: img.height,
            timestamp: new Date().toISOString(),
          };

          // Try to get location if available
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                meta.location = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                };
                resolve(meta);
              },
              (error) => {
                console.log("Location not available:", error.message);
                resolve(meta);
              }
            );
          } else {
            resolve(meta);
          }
        };
        img.src = imageUrl;
      });

      console.log("Image metadata:", metadata);

      // Send both image and metadata to API
      const response = await fetch("http://localhost:3103/api/vision", {
        method: "POST",
        body: JSON.stringify({
          imageUrl,
          metadata,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Vision API Response:", {
        description: data.content,
        receivedAt: data.timeReceived,
      });
    } catch (error) {
      console.error("Error sending image to API:", error);
    }
  }

  // Create an observer instance
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      try {
        // Only process mutations that add nodes
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Process added nodes
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Look for images within added nodes
              const images = node.querySelectorAll("img");
              images.forEach((img) => {
                // Filter out small images (likely icons)
                if (img.height > 50) {
                  console.log("New message image found:", {
                    src: img.src,
                    height: img.height,
                    width: img.width,
                  });
                  // Send image to API for analysis
                  sendImageToAPI(img.src);
                }
              });
            }
          });
        }
      } catch (error) {
        console.error("Error processing mutation:", error);
      }
    });
  });

  // Configure and start the observer
  observer.observe(messagesContainer, {
    childList: true,
    subtree: true,
    attributes: false, // Don't watch for attribute changes
    characterData: false, // Don't watch for text changes
  });

  console.log("Observer started successfully - To test:");
  console.log("1. Send an image in the chat");
  console.log("2. Watch this console for image detection and AI analysis");
  alert("Added Messenger Chat Observer - Send an image to test!");
})();
