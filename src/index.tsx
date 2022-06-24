import {h} from "preact";
import {useCallback, useEffect, useMemo, useRef, useState} from "preact/compat";
import register from "preact-custom-element";
import {loadScript} from "./loadScript";

type Props = {
  src: string
  align?: 'left' | 'center' | 'right'
}

const heightStore: {
  [tweetId: string]: string;
} = {}
const containerClassName = 'embed-twitter-container'
const fallbackLinkClassName = 'embed-twitter-link'

const App = ({src, align = 'center'}: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [frameReady, setFrameReady] = useState(false);

  const tweetId = useMemo(() => {
    const match = src.match(/https?:\/\/twitter.com\/(.*?)\/status\/(\d+)[/?]?/);
    if (match && match[2]) {
      return match[2]
    }
    return null
  }, [src]);

  const attribute = useMemo(() => {
    return tweetId && heightStore[tweetId]
      ? `style="min-height: ${encodeURIComponent(heightStore[tweetId])};"`
      : ''
  }, [])

  const embedTweet = useCallback(async () => {
    if (!(src && tweetId)) {
      console.log(`Invalid tweet URL:${src}`)
      return
    }

    if (!(window as any).twttr?.ready) {
      await loadScript({
        src: 'https://platform.twitter.com/widgets.js',
        id: 'twitter-widgets'
      })
    }

    const container = ref.current;
    await (window as any).twttr?.widgets?.createTweet(tweetId, container, {
      align: align
    })
    setFrameReady(true)
    const iframe = container?.querySelector('iframe')
    if (!iframe) return
    setTimeout(() => {
      heightStore[tweetId] = iframe.style.height
    }, 1000)
  }, [])

  useEffect(() => {
    embedTweet();
  }, [embedTweet])

  return (
    <div class={`${containerClassName} ${attribute}`} ref={ref}>
      {!frameReady && (
        <div>
          <a href={src} className={fallbackLinkClassName} rel='nofollow'>{src}</a>
        </div>
      )}
    </div>
  )
}

register(
  App,
  'embed-twitter',
  [
    'src',
    'align'
  ]
)