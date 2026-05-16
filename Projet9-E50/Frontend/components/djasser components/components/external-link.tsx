// external-link.tsx
import * as React from 'react'; // safer default import for TS with esModuleInterop
import { ComponentProps } from 'react';
import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event: any) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent default behavior on native
          event.preventDefault();

          // Open the link in an in-app browser
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}