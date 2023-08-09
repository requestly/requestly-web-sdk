export const isMediaRequest = (contentType: string): boolean => {
  const regexExp = /^(image|audio|video)\/.+$/gi;
  return regexExp?.test(contentType);
};

export const getObjectSizeInBytes = (obj): number => {
  if (!obj) {
    return NaN;
  }

  let stringifiedObj: string = obj;
  try {
    if (typeof obj !== 'string') {
      stringifiedObj = JSON.stringify(obj);
    }
  } catch (e) {
    // skip
  }

  const size = stringifiedObj.length;
  return size;
};
