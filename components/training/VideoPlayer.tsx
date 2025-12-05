"use client";

import { useState } from "react";
import { Play, AlertCircle, ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onComplete?: () => void;
}

type VideoType = "youtube" | "vimeo" | "microsoft-stream" | "sharepoint" | "onedrive" | "mp4" | "unknown";

export default function VideoPlayer({ videoUrl, title, onComplete }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine video type from URL
  const getVideoType = (url: string): VideoType => {
    if (!url) return "unknown";

    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return "youtube";
    }

    // Microsoft Stream (classic)
    if (url.includes("microsoftstream.com") || url.includes("web.microsoftstream.com")) {
      return "microsoft-stream";
    }

    // SharePoint (includes Stream on SharePoint)
    // Patterns: *.sharepoint.com (but NOT *-my.sharepoint.com which is OneDrive)
    if (url.includes("sharepoint.com") && !url.includes("-my.sharepoint.com")) {
      return "sharepoint";
    }

    // OneDrive (personal and business)
    // Patterns: onedrive.live.com, *-my.sharepoint.com
    if (url.includes("onedrive.live.com") || url.includes("-my.sharepoint.com")) {
      return "onedrive";
    }

    // Vimeo
    if (url.includes("vimeo.com")) {
      return "vimeo";
    }

    // MP4 direct links
    if (url.endsWith(".mp4") || url.includes(".mp4?")) {
      return "mp4";
    }

    return "unknown";
  };

  // Extract YouTube video ID
  const getYouTubeVideoId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : "";
  };

  // Extract Vimeo video ID
  const getVimeoVideoId = (url: string): string => {
    const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);
    return match ? match[3] : "";
  };

  // Transform SharePoint URL to embed format
  const getSharePointEmbedUrl = (url: string): string => {
    // If already an embed URL, use as-is
    if (url.includes("embed.aspx") || url.includes("action=embedview")) {
      return url;
    }

    // Handle SharePoint video sharing links
    // Pattern: https://{tenant}.sharepoint.com/:v:/g/{site}/{id}
    // Transform to embed URL
    try {
      const urlObj = new URL(url);

      // If it's a /:v:/ sharing link, transform it
      if (urlObj.pathname.includes("/:v:/")) {
        // Add action=embedview to enable embedding
        urlObj.searchParams.set("action", "embedview");
        return urlObj.toString();
      }

      // If it's a Doc.aspx link, add embedview action
      if (urlObj.pathname.includes("/Doc.aspx")) {
        urlObj.searchParams.set("action", "embedview");
        return urlObj.toString();
      }

      // For Stream on SharePoint links (/video/ paths)
      if (urlObj.pathname.includes("/video/")) {
        // These should work with iframe embedding directly
        return url;
      }

      // Default: try adding embed action
      urlObj.searchParams.set("action", "embedview");
      return urlObj.toString();
    } catch {
      // If URL parsing fails, return original
      return url;
    }
  };

  // Transform OneDrive URL to embed format
  const getOneDriveEmbedUrl = (url: string): string => {
    // If already an embed URL, use as-is
    if (url.includes("/embed")) {
      return url;
    }

    try {
      const urlObj = new URL(url);

      // OneDrive personal: onedrive.live.com
      if (urlObj.hostname === "onedrive.live.com") {
        // Transform to embed URL
        urlObj.pathname = urlObj.pathname.replace("/view", "/embed");
        if (!urlObj.pathname.includes("/embed")) {
          // Try converting /redir to /embed
          urlObj.pathname = "/embed" + urlObj.search;
        }
        return urlObj.toString();
      }

      // OneDrive for Business: {tenant}-my.sharepoint.com
      if (urlObj.hostname.includes("-my.sharepoint.com")) {
        // Handle /:v:/g/personal/ sharing links
        if (urlObj.pathname.includes("/:v:/")) {
          urlObj.searchParams.set("action", "embedview");
          return urlObj.toString();
        }

        // Add embed action
        urlObj.searchParams.set("action", "embedview");
        return urlObj.toString();
      }

      return url;
    } catch {
      return url;
    }
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    // Notify parent that video was watched after a delay
    if (onComplete) {
      setTimeout(onComplete, 1000);
    }
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setError("Failed to load video. Please try again later.");
  };

  const videoType = getVideoType(videoUrl);

  const renderVideoPlayer = () => {
    switch (videoType) {
      case "youtube":
        const youtubeId = getYouTubeVideoId(videoUrl);
        return (
          <iframe
            className="w-full h-full absolute top-0 left-0"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleVideoLoad}
            onError={handleVideoError}
          />
        );

      case "microsoft-stream":
        return (
          <iframe
            className="w-full h-full absolute top-0 left-0"
            src={videoUrl}
            title={title}
            frameBorder="0"
            allowFullScreen
            onLoad={handleVideoLoad}
            onError={handleVideoError}
          />
        );

      case "sharepoint":
        const sharePointEmbedUrl = getSharePointEmbedUrl(videoUrl);
        return (
          <iframe
            className="w-full h-full absolute top-0 left-0"
            src={sharePointEmbedUrl}
            title={title}
            frameBorder="0"
            allowFullScreen
            onLoad={handleVideoLoad}
            onError={handleVideoError}
          />
        );

      case "onedrive":
        const oneDriveEmbedUrl = getOneDriveEmbedUrl(videoUrl);
        return (
          <iframe
            className="w-full h-full absolute top-0 left-0"
            src={oneDriveEmbedUrl}
            title={title}
            frameBorder="0"
            allowFullScreen
            onLoad={handleVideoLoad}
            onError={handleVideoError}
          />
        );

      case "vimeo":
        const vimeoId = getVimeoVideoId(videoUrl);
        return (
          <iframe
            className="w-full h-full absolute top-0 left-0"
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title={title}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={handleVideoLoad}
            onError={handleVideoError}
          />
        );

      case "mp4":
        return (
          <video
            className="w-full h-full absolute top-0 left-0"
            controls
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            onEnded={onComplete}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );

      case "unknown":
      default:
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Unsupported video format</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center p-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              onClick={() => window.open(videoUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
              Open Video in New Tab
            </button>
          </div>
        </div>
      ) : (
        renderVideoPlayer()
      )}
    </div>
  );
}
