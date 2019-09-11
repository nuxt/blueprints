const actualUtils = jest.requireActual('src/utils')

export function resetUtilMocks (mockedUtils, utilNames) {
  for (const utilName in actualUtils) {
    if (!utilNames || utilNames.includes(utilName)) {
      mockedUtils[utilName].mockReset()
      mockedUtils[utilName].mockImplementation(actualUtils[utilName])
    }
  }
}
