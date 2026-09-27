import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { description, filename } = await request.json();
    const text = ((description || '') + ' ' + (filename || '')).toLowerCase();

    let category = 'pothole';
    let confidence = 0.6;

    if (text.match(/pothole|road|crack/)) {
      category = 'pothole';
      confidence = 0.85;
    } else if (text.match(/garbage|waste|trash|dump/)) {
      category = 'garbage';
      confidence = 0.88;
    } else if (text.match(/light|lamp|dark|streetlight/)) {
      category = 'streetlight';
      confidence = 0.82;
    } else if (text.match(/water|leak|pipe|burst/)) {
      category = 'water-leakage';
      confidence = 0.8;
    } else if (text.match(/drain|block|flood|waterlog/)) {
      category = 'blocked-drain';
      confidence = 0.86;
    } else if (text.match(/signal|traffic/)) {
      category = 'traffic-signal';
      confidence = 0.83;
    } else if (text.match(/tree|fallen|branch/)) {
      category = 'fallen-tree';
      confidence = 0.81;
    }

    return NextResponse.json({ category, confidence, source: 'ai-simulation' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
